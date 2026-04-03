#!/usr/bin/env node

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import http from "node:http";
import { ApolloClient } from "./apollo-client.js";

// People tools
import {
  searchPeopleDef, searchPeople,
  enrichPersonDef, enrichPerson,
  bulkEnrichPeopleDef, bulkEnrichPeople,
} from "./tools/people.js";

// Organization tools
import {
  searchOrganizationsDef, searchOrganizations,
  enrichOrganizationDef, enrichOrganization,
  getOrganizationDef, getOrganization,
  getOrganizationJobPostingsDef, getOrganizationJobPostings,
} from "./tools/organizations.js";

// Contact tools
import {
  createContactDef, createContact,
  updateContactDef, updateContact,
  getContactDef, getContact,
  searchContactsDef, searchContacts,
  deleteContactDef, deleteContact,
  bulkCreateContactsDef, bulkCreateContacts,
  bulkUpdateContactsDef, bulkUpdateContacts,
} from "./tools/contacts.js";

// Account tools
import {
  createAccountDef, createAccount,
  updateAccountDef, updateAccount,
  searchAccountsDef, searchAccounts,
} from "./tools/accounts.js";

// Sequence tools
import {
  searchSequencesDef, searchSequences,
  addContactsToSequenceDef, addContactsToSequence,
  updateSequenceStatusDef, updateSequenceStatus,
} from "./tools/sequences.js";

// Email tools
import {
  searchOutreachEmailsDef, searchOutreachEmails,
  getEmailActivitiesDef, getEmailActivities,
  listEmailAccountsDef, listEmailAccounts,
} from "./tools/emails.js";

// Field tools
import {
  listFieldsDef, listFields,
  createCustomFieldDef, createCustomField,
  listCustomFieldsDeprecatedDef, listCustomFieldsDeprecated,
} from "./tools/fields.js";

// Usage tools
import {
  searchNewsArticlesDef, searchNewsArticles,
  getApiUsageStatsDef, getApiUsageStats,
} from "./tools/usage.js";

// Label tools (undocumented)
import {
  listLabelsDef, listLabels,
  createLabelDef, createLabel,
  updateLabelDef, updateLabel,
  deleteLabelDef, deleteLabel,
} from "./tools/labels.js";

// Stage tools (undocumented)
import {
  listContactStagesDef, listContactStages,
  listAccountStagesDef, listAccountStages,
  listOpportunityStagesDef, listOpportunityStages,
} from "./tools/stages.js";

// Opportunity tools (undocumented)
import {
  searchOpportunitiesDef, searchOpportunities,
  getOpportunityDef, getOpportunity,
  createOpportunityDef, createOpportunity,
  updateOpportunityDef, updateOpportunity,
} from "./tools/opportunities.js";

// Task tools (undocumented)
import {
  searchTasksDef, searchTasks,
  getTaskDef, getTask,
  createTaskDef, createTask,
  updateTaskDef, updateTask,
} from "./tools/tasks.js";

// Note tools (undocumented)
import {
  searchNotesDef, searchNotes,
  createNoteDef, createNote,
  deleteNoteDef, deleteNote,
} from "./tools/notes.js";

// User tools (undocumented)
import {
  searchUsersDef, searchUsers,
} from "./tools/users.js";

// Activity tools (undocumented)
import {
  searchActivitiesDef, searchActivities,
  searchPhoneCallsDef, searchPhoneCalls,
} from "./tools/activities.js";

// Health check (undocumented)
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

const server = new McpServer({
  name: "apollo-io",
  version: "1.0.0",
});

// Helper to wrap handler results into MCP text content
async function handleToolCall(
  handler: () => Promise<Record<string, unknown>>
) {
  try {
    const result = await handler();
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }],
    };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return {
      content: [{ type: "text" as const, text: JSON.stringify({ error: true, message }, null, 2) }],
      isError: true as const,
    };
  }
}

// =====================
// Register all 45 tools
// =====================

// --- People (3) ---
server.tool(
  searchPeopleDef.name,
  searchPeopleDef.description,
  searchPeopleDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchPeople(apollo, searchPeopleDef.inputSchema.parse(params)))
);

server.tool(
  enrichPersonDef.name,
  enrichPersonDef.description,
  enrichPersonDef.inputSchema.shape,
  async (params) => handleToolCall(() => enrichPerson(apollo, enrichPersonDef.inputSchema.parse(params)))
);

server.tool(
  bulkEnrichPeopleDef.name,
  bulkEnrichPeopleDef.description,
  bulkEnrichPeopleDef.inputSchema.shape,
  async (params) => handleToolCall(() => bulkEnrichPeople(apollo, bulkEnrichPeopleDef.inputSchema.parse(params)))
);

// --- Organizations (4) ---
server.tool(
  searchOrganizationsDef.name,
  searchOrganizationsDef.description,
  searchOrganizationsDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchOrganizations(apollo, searchOrganizationsDef.inputSchema.parse(params)))
);

server.tool(
  enrichOrganizationDef.name,
  enrichOrganizationDef.description,
  enrichOrganizationDef.inputSchema.shape,
  async (params) => handleToolCall(() => enrichOrganization(apollo, enrichOrganizationDef.inputSchema.parse(params)))
);

server.tool(
  getOrganizationDef.name,
  getOrganizationDef.description,
  getOrganizationDef.inputSchema.shape,
  async (params) => handleToolCall(() => getOrganization(apollo, getOrganizationDef.inputSchema.parse(params)))
);

server.tool(
  getOrganizationJobPostingsDef.name,
  getOrganizationJobPostingsDef.description,
  getOrganizationJobPostingsDef.inputSchema.shape,
  async (params) => handleToolCall(() => getOrganizationJobPostings(apollo, getOrganizationJobPostingsDef.inputSchema.parse(params)))
);

// --- Contacts (7) ---
server.tool(
  createContactDef.name,
  createContactDef.description,
  createContactDef.inputSchema.shape,
  async (params) => handleToolCall(() => createContact(apollo, createContactDef.inputSchema.parse(params)))
);

server.tool(
  updateContactDef.name,
  updateContactDef.description,
  updateContactDef.inputSchema.shape,
  async (params) => handleToolCall(() => updateContact(apollo, updateContactDef.inputSchema.parse(params)))
);

server.tool(
  getContactDef.name,
  getContactDef.description,
  getContactDef.inputSchema.shape,
  async (params) => handleToolCall(() => getContact(apollo, getContactDef.inputSchema.parse(params)))
);

server.tool(
  searchContactsDef.name,
  searchContactsDef.description,
  searchContactsDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchContacts(apollo, searchContactsDef.inputSchema.parse(params)))
);

server.tool(
  deleteContactDef.name,
  deleteContactDef.description,
  deleteContactDef.inputSchema.shape,
  async (params) => handleToolCall(() => deleteContact(apollo, deleteContactDef.inputSchema.parse(params)))
);

server.tool(
  bulkCreateContactsDef.name,
  bulkCreateContactsDef.description,
  bulkCreateContactsDef.inputSchema.shape,
  async (params) => handleToolCall(() => bulkCreateContacts(apollo, bulkCreateContactsDef.inputSchema.parse(params)))
);

server.tool(
  bulkUpdateContactsDef.name,
  bulkUpdateContactsDef.description,
  bulkUpdateContactsDef.inputSchema.shape,
  async (params) => handleToolCall(() => bulkUpdateContacts(apollo, bulkUpdateContactsDef.inputSchema.parse(params)))
);

// --- Accounts (3) ---
server.tool(
  createAccountDef.name,
  createAccountDef.description,
  createAccountDef.inputSchema.shape,
  async (params) => handleToolCall(() => createAccount(apollo, createAccountDef.inputSchema.parse(params)))
);

server.tool(
  updateAccountDef.name,
  updateAccountDef.description,
  updateAccountDef.inputSchema.shape,
  async (params) => handleToolCall(() => updateAccount(apollo, updateAccountDef.inputSchema.parse(params)))
);

server.tool(
  searchAccountsDef.name,
  searchAccountsDef.description,
  searchAccountsDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchAccounts(apollo, searchAccountsDef.inputSchema.parse(params)))
);

// --- Sequences (3) ---
server.tool(
  searchSequencesDef.name,
  searchSequencesDef.description,
  searchSequencesDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchSequences(apollo, searchSequencesDef.inputSchema.parse(params)))
);

server.tool(
  addContactsToSequenceDef.name,
  addContactsToSequenceDef.description,
  addContactsToSequenceDef.inputSchema.shape,
  async (params) => handleToolCall(() => addContactsToSequence(apollo, addContactsToSequenceDef.inputSchema.parse(params)))
);

server.tool(
  updateSequenceStatusDef.name,
  updateSequenceStatusDef.description,
  updateSequenceStatusDef.inputSchema.shape,
  async (params) => handleToolCall(() => updateSequenceStatus(apollo, updateSequenceStatusDef.inputSchema.parse(params)))
);

// --- Emails (3) ---
server.tool(
  searchOutreachEmailsDef.name,
  searchOutreachEmailsDef.description,
  searchOutreachEmailsDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchOutreachEmails(apollo, searchOutreachEmailsDef.inputSchema.parse(params)))
);

server.tool(
  getEmailActivitiesDef.name,
  getEmailActivitiesDef.description,
  getEmailActivitiesDef.inputSchema.shape,
  async (params) => handleToolCall(() => getEmailActivities(apollo, getEmailActivitiesDef.inputSchema.parse(params)))
);

server.tool(
  listEmailAccountsDef.name,
  listEmailAccountsDef.description,
  listEmailAccountsDef.inputSchema.shape,
  async (params) => handleToolCall(() => listEmailAccounts(apollo, listEmailAccountsDef.inputSchema.parse(params)))
);

// --- Fields (3) ---
server.tool(
  listFieldsDef.name,
  listFieldsDef.description,
  listFieldsDef.inputSchema.shape,
  async (params) => handleToolCall(() => listFields(apollo, listFieldsDef.inputSchema.parse(params)))
);

server.tool(
  createCustomFieldDef.name,
  createCustomFieldDef.description,
  createCustomFieldDef.inputSchema.shape,
  async (params) => handleToolCall(() => createCustomField(apollo, createCustomFieldDef.inputSchema.parse(params)))
);

server.tool(
  listCustomFieldsDeprecatedDef.name,
  listCustomFieldsDeprecatedDef.description,
  listCustomFieldsDeprecatedDef.inputSchema.shape,
  async (params) => handleToolCall(() => listCustomFieldsDeprecated(apollo, listCustomFieldsDeprecatedDef.inputSchema.parse(params)))
);

// --- Usage (2) ---
server.tool(
  searchNewsArticlesDef.name,
  searchNewsArticlesDef.description,
  searchNewsArticlesDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchNewsArticles(apollo, searchNewsArticlesDef.inputSchema.parse(params)))
);

server.tool(
  getApiUsageStatsDef.name,
  getApiUsageStatsDef.description,
  getApiUsageStatsDef.inputSchema.shape,
  async (params) => handleToolCall(() => getApiUsageStats(apollo, getApiUsageStatsDef.inputSchema.parse(params)))
);

// --- Labels (4, undocumented) ---
server.tool(
  listLabelsDef.name,
  listLabelsDef.description,
  listLabelsDef.inputSchema.shape,
  async (params) => handleToolCall(() => listLabels(apollo, listLabelsDef.inputSchema.parse(params)))
);

server.tool(
  createLabelDef.name,
  createLabelDef.description,
  createLabelDef.inputSchema.shape,
  async (params) => handleToolCall(() => createLabel(apollo, createLabelDef.inputSchema.parse(params)))
);

server.tool(
  updateLabelDef.name,
  updateLabelDef.description,
  updateLabelDef.inputSchema.shape,
  async (params) => handleToolCall(() => updateLabel(apollo, updateLabelDef.inputSchema.parse(params)))
);

server.tool(
  deleteLabelDef.name,
  deleteLabelDef.description,
  deleteLabelDef.inputSchema.shape,
  async (params) => handleToolCall(() => deleteLabel(apollo, deleteLabelDef.inputSchema.parse(params)))
);

// --- Stages (3, undocumented) ---
server.tool(
  listContactStagesDef.name,
  listContactStagesDef.description,
  listContactStagesDef.inputSchema.shape,
  async (params) => handleToolCall(() => listContactStages(apollo, listContactStagesDef.inputSchema.parse(params)))
);

server.tool(
  listAccountStagesDef.name,
  listAccountStagesDef.description,
  listAccountStagesDef.inputSchema.shape,
  async (params) => handleToolCall(() => listAccountStages(apollo, listAccountStagesDef.inputSchema.parse(params)))
);

server.tool(
  listOpportunityStagesDef.name,
  listOpportunityStagesDef.description,
  listOpportunityStagesDef.inputSchema.shape,
  async (params) => handleToolCall(() => listOpportunityStages(apollo, listOpportunityStagesDef.inputSchema.parse(params)))
);

// --- Opportunities (4, undocumented) ---
server.tool(
  searchOpportunitiesDef.name,
  searchOpportunitiesDef.description,
  searchOpportunitiesDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchOpportunities(apollo, searchOpportunitiesDef.inputSchema.parse(params)))
);

server.tool(
  getOpportunityDef.name,
  getOpportunityDef.description,
  getOpportunityDef.inputSchema.shape,
  async (params) => handleToolCall(() => getOpportunity(apollo, getOpportunityDef.inputSchema.parse(params)))
);

server.tool(
  createOpportunityDef.name,
  createOpportunityDef.description,
  createOpportunityDef.inputSchema.shape,
  async (params) => handleToolCall(() => createOpportunity(apollo, createOpportunityDef.inputSchema.parse(params)))
);

server.tool(
  updateOpportunityDef.name,
  updateOpportunityDef.description,
  updateOpportunityDef.inputSchema.shape,
  async (params) => handleToolCall(() => updateOpportunity(apollo, updateOpportunityDef.inputSchema.parse(params)))
);

// --- Tasks (4, undocumented) ---
server.tool(
  searchTasksDef.name,
  searchTasksDef.description,
  searchTasksDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchTasks(apollo, searchTasksDef.inputSchema.parse(params)))
);

server.tool(
  getTaskDef.name,
  getTaskDef.description,
  getTaskDef.inputSchema.shape,
  async (params) => handleToolCall(() => getTask(apollo, getTaskDef.inputSchema.parse(params)))
);

server.tool(
  createTaskDef.name,
  createTaskDef.description,
  createTaskDef.inputSchema.shape,
  async (params) => handleToolCall(() => createTask(apollo, createTaskDef.inputSchema.parse(params)))
);

server.tool(
  updateTaskDef.name,
  updateTaskDef.description,
  updateTaskDef.inputSchema.shape,
  async (params) => handleToolCall(() => updateTask(apollo, updateTaskDef.inputSchema.parse(params)))
);

// --- Notes (3, undocumented) ---
server.tool(
  searchNotesDef.name,
  searchNotesDef.description,
  searchNotesDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchNotes(apollo, searchNotesDef.inputSchema.parse(params)))
);

server.tool(
  createNoteDef.name,
  createNoteDef.description,
  createNoteDef.inputSchema.shape,
  async (params) => handleToolCall(() => createNote(apollo, createNoteDef.inputSchema.parse(params)))
);

server.tool(
  deleteNoteDef.name,
  deleteNoteDef.description,
  deleteNoteDef.inputSchema.shape,
  async (params) => handleToolCall(() => deleteNote(apollo, deleteNoteDef.inputSchema.parse(params)))
);

// --- Users (1, undocumented) ---
server.tool(
  searchUsersDef.name,
  searchUsersDef.description,
  searchUsersDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchUsers(apollo, searchUsersDef.inputSchema.parse(params)))
);

// --- Activities (2, undocumented) ---
server.tool(
  searchActivitiesDef.name,
  searchActivitiesDef.description,
  searchActivitiesDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchActivities(apollo, searchActivitiesDef.inputSchema.parse(params)))
);

server.tool(
  searchPhoneCallsDef.name,
  searchPhoneCallsDef.description,
  searchPhoneCallsDef.inputSchema.shape,
  async (params) => handleToolCall(() => searchPhoneCalls(apollo, searchPhoneCallsDef.inputSchema.parse(params)))
);

// --- Health (1, undocumented) ---
server.tool(
  healthCheckDef.name,
  healthCheckDef.description,
  healthCheckDef.inputSchema.shape,
  async (params) => handleToolCall(() => healthCheck(apollo, healthCheckDef.inputSchema.parse(params)))
);

// --- Start ---
async function main() {
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : null;

  if (port) {
    // SSE transport for cloud deployment (Railway / Poke)
    let sseTransport: SSEServerTransport | null = null;

    const httpServer = http.createServer(async (req, res) => {
      const url = new URL(req.url || "/", `http://${req.headers.host}`);

      if (url.pathname === "/sse" && req.method === "GET") {
        sseTransport = new SSEServerTransport("/messages", res);
        await server.connect(sseTransport);
      } else if (url.pathname === "/messages" && req.method === "POST") {
        if (sseTransport) {
          await sseTransport.handlePostMessage(req, res);
        } else {
          res.writeHead(400);
          res.end("No active SSE connection");
        }
      } else if (url.pathname === "/health") {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ status: "ok" }));
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
    // stdio transport for local usage
    const transport = new StdioServerTransport();
    await server.connect(transport);
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
