import { query } from "./_generated/server";
import { v } from "convex/values";

export const getSessions = query({
  args: {},
  handler: async (ctx) => {
    const sessions = await ctx.db.query("sessions").collect();
    return sessions.map((s) => ({
      _id: s._id,
      name: s.name,
      phone: s.phone,
      username: s.username,
      firstName: s.firstName,
      lastName: s.lastName,
      sessionString: s.sessionString,
      createdAt: s.createdAt,
    }));
  },
});

export const getJoinedChannels = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("joinedChannels").collect();
  },
});

export const getJoinedBySession = query({
  args: { sessionName: v.string() },
  handler: async (ctx, { sessionName }) => {
    return await ctx.db
      .query("joinedChannels")
      .withIndex("by_session", (q) => q.eq("sessionName", sessionName))
      .collect();
  },
});

export const getPendingCommands = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db
      .query("commands")
      .withIndex("by_status", (q) => q.eq("status", "pending"))
      .collect();
  },
});

export const getCommand = query({
  args: { id: v.id("commands") },
  handler: async (ctx, { id }) => {
    return await ctx.db.get(id);
  },
});

export const getAuthFlow = query({
  args: { flowId: v.string() },
  handler: async (ctx, { flowId }) => {
    return await ctx.db
      .query("authFlows")
      .withIndex("by_flowId", (q) => q.eq("flowId", flowId))
      .first();
  },
});

export const getApiKey = query({
  args: {},
  handler: async (ctx) => {
    const cfg = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", "apiKey"))
      .first();
    return cfg?.value ?? null;
  },
});

export const getBackendHeartbeat = query({
  args: {},
  handler: async (ctx) => {
    const cfg = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", "backendHeartbeat"))
      .first();
    return cfg?.value ? parseInt(cfg.value) : null;
  },
});
