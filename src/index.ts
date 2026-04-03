#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import http from "node:http";
import { ApolloClient } from "./apollo-client.js";

// People tools (search & enrich only)
import {
  searchPeopleDef, searchPeople,
  enrichPersonDef, enrichPerson,
  bulkEnrichPeopleDef, bulkEnrichPeople,
} from "./tools/people.js";

// Organization tools (search & enrich only)
import {
  searchOrganizationsDef, searchOrganizations,
  enrichOrganizationDef, enrichOrganization,
  getOrganizationDef, getOrganization,
  getOrganizationJobPostingsDef, getOrganizationJobPostings,
} from "./tools/organizations.js";

// Contact tools (read-only)
import {
  getContactDef, getContact,
  searchContactsDef, searchContacts,
} from "./tools/contacts.js";

// Account tools (read-only)
import {
  searchAccountsDef, searchAccounts,
} from "./tools/accounts.js";

// Usage tools (read-only)
import {
  searchNewsArticlesDef, searchNewsArticles,
} from "./tools/usage.js";

// Health check
import {
  healthCheckDef, healthCheck,
} from "./tools/health.js";

// --- Startup validation ---
const apiKey = process.env.APOLLO_API_KEY;
if (!apiKey) {
  console.error("ERROR: APOLLO_API_KEY environment variable is required.");
  process.exit(1);
}

const apollo = new ApolloClient(apiKey);

function createServer() {
  const server = new McpServer({
    name: "apollo-io",
    version: "1.0.0",
  });

  function handleToolCall(handler: () => Promise<Record<string, unknown>>) {
    return handler().then(
      (result) => ({
        content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
      }),
      (err: unknown) => {
        const message = err instanceof Error ? err.message : String(err);
        return {
          content: [{ type: "text" as const, text: JSON.stringify({ error: true, message }, null, 2) }],
          isError: true as const,
        };
      }
    );
  }

  // --- People (3) ---
  server.tool(searchPeopleDef.name, searchPeopleDef.description, searchPeopleDef.inputSchema.shape,
    async (params) => handleToolCall(() => searchPeople(apollo, searchPeopleDef.inputSchema.parse(params))));
  server.tool(enrichPersonDef.name, enrichPersonDef.description, enrichPersonDef.inputSchema.shape,
    async (params) => handleToolCall(() => enrichPerson(apollo, enrichPersonDef.inputSchema.parse(params))));
  server.tool(bulkEnrichPeopleDef.name, bulkEnrichPeopleDef.description, bulkEnrichPeopleDef.inputSchema.shape,
    async (params) => handleToolCall(() => bulkEnrichPeople(apollo, bulkEnrichPeopleDef.inputSchema.parse(params))));

  // --- Organizations (4) ---
  server.tool(searchOrganizationsDef.name, searchOrganizationsDef.description, searchOrganizationsDef.inputSchema.shape,
    async (params) => handleToolCall(() => searchOrganizations(apollo, searchOrganizationsDef.inputSchema.parse(params))));
  server.tool(enrichOrganizationDef.name, enrichOrganizationDef.description, enrichOrganizationDef.inputSchema.shape,
    async (params) => handleToolCall(() => enrichOrganization(apollo, enrichOrganizationDef.inputSchema.parse(params))));
  server.tool(getOrganizationDef.name, getOrganizationDef.description, getOrganizationDef.inputSchema.shape,
    async (params) => handleToolCall(() => getOrganization(apollo, getOrganizationDef.inputSchema.parse(params))));
  server.tool(getOrganizationJobPostingsDef.name, getOrganizationJobPostingsDef.description, getOrganizationJobPostingsDef.inputSchema.shape,
    async (params) => handleToolCall(() => getOrganizationJobPostings(apollo, getOrganizationJobPostingsDef.inputSchema.parse(params))));

  // --- Contacts (2, read-only) ---
  server.tool(getContactDef.name, getContactDef.description, getContactDef.inputSchema.shape,
    async (params) => handleToolCall(() => getContact(apollo, getContactDef.inputSchema.parse(params))));
  server.tool(searchContactsDef.name, searchContactsDef.description, searchContactsDef.inputSchema.shape,
    async (params) => handleToolCall(() => searchContacts(apollo, searchContactsDef.inputSchema.parse(params))));

  // --- Accounts (1, read-only) ---
  server.tool(searchAccountsDef.name, searchAccountsDef.description, searchAccountsDef.inputSchema.shape,
    async (params) => handleToolCall(() => searchAccounts(apollo, searchAccountsDef.inputSchema.parse(params))));

  // --- News (1) ---
  server.tool(searchNewsArticlesDef.name, searchNewsArticlesDef.description, searchNewsArticlesDef.inputSchema.shape,
    async (params) => handleToolCall(() => searchNewsArticles(apollo, searchNewsArticlesDef.inputSchema.parse(params))));

  // --- Health (1) ---
  server.tool(healthCheckDef.name, healthCheckDef.description, healthCheckDef.inputSchema.shape,
    async (params) => handleToolCall(() => healthCheck(apollo, healthCheckDef.inputSchema.parse(params))));

  return server;
}

// --- Start ---
async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : null;

  if (port) {
    const sessions = new Map<string, { server: McpServer; transport: SSEServerTransport }>();

    const httpServer = http.createServer(async (req, res) => {
      const url = new URL(req.url || "/", `http://${req.headers.host}`);

      if (url.pathname === "/sse" && req.method === "GET") {
        const mcpServer = createServer();
        const transport = new SSEServerTransport("/messages", res);
        sessions.set(transport.sessionId, { server: mcpServer, transport });
        transport.onclose = () => sessions.delete(transport.sessionId);
        await mcpServer.connect(transport);
      } else if (url.pathname === "/messages" && req.method === "POST") {
        const sessionId = url.searchParams.get("sessionId");
        const session = sessionId ? sessions.get(sessionId) : null;
        if (session) {
          await session.transport.handlePostMessage(req, res);
        } else {
          res.writeHead(400, { "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Invalid or expired session" }));
        }
      } else if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok", sessions: sessions.size }));
      } else {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    httpServer.listen(port, "0.0.0.0", () => {
      console.log(`Apollo MCP SSE server listening on port ${port}`);
      console.log(`SSE endpoint: http://0.0.0.0:${port}/sse`);
    });
  } else {
    const server = createServer();
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
