import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  sessions: defineTable({
    name: v.string(),
    phone: v.string(),
    userId: v.string(),
    username: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    sessionString: v.string(),
    createdAt: v.string(),
  }).index("by_name", ["name"]),

  joinedChannels: defineTable({
    sessionName: v.string(),
    channelLink: v.string(),
  }).index("by_session", ["sessionName"]),

  commands: defineTable({
    type: v.string(),
    payload: v.any(),
    status: v.string(),
    result: v.optional(v.any()),
    createdAt: v.number(),
  }).index("by_status", ["status"]),

  authFlows: defineTable({
    flowId: v.string(),
    phone: v.string(),
    step: v.string(),
    sessionName: v.optional(v.string()),
    inputValue: v.optional(v.string()),
    result: v.optional(v.string()),
    error: v.optional(v.string()),
    createdAt: v.number(),
  }).index("by_flowId", ["flowId"]).index("by_step", ["step"]),

  config: defineTable({
    key: v.string(),
    value: v.string(),
  }).index("by_key", ["key"]),
});
