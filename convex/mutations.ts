import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const upsertSession = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    userId: v.string(),
    username: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    sessionString: v.string(),
    createdAt: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("sessions")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, args);
    } else {
      await ctx.db.insert("sessions", args);
    }
  },
});

export const deleteSession = mutation({
  args: { name: v.string() },
  handler: async (ctx, { name }) => {
    const session = await ctx.db
      .query("sessions")
      .withIndex("by_name", (q) => q.eq("name", name))
      .first();
    if (session) await ctx.db.delete(session._id);

    const joined = await ctx.db
      .query("joinedChannels")
      .withIndex("by_session", (q) => q.eq("sessionName", name))
      .collect();
    for (const j of joined) await ctx.db.delete(j._id);
  },
});

export const addJoinedChannel = mutation({
  args: { sessionName: v.string(), channelLink: v.string() },
  handler: async (ctx, { sessionName, channelLink }) => {
    const existing = await ctx.db
      .query("joinedChannels")
      .withIndex("by_session", (q) => q.eq("sessionName", sessionName))
      .filter((q) => q.eq(q.field("channelLink"), channelLink))
      .first();
    if (!existing) {
      await ctx.db.insert("joinedChannels", { sessionName, channelLink });
    }
  },
});

export const removeJoinedChannel = mutation({
  args: { sessionName: v.string(), channelLink: v.string() },
  handler: async (ctx, { sessionName, channelLink }) => {
    const record = await ctx.db
      .query("joinedChannels")
      .withIndex("by_session", (q) => q.eq("sessionName", sessionName))
      .filter((q) => q.eq(q.field("channelLink"), channelLink))
      .first();
    if (record) await ctx.db.delete(record._id);
  },
});

export const clearAllJoinedChannels = mutation({
  args: {},
  handler: async (ctx) => {
    const all = await ctx.db.query("joinedChannels").collect();
    for (const j of all) await ctx.db.delete(j._id);
  },
});

export const createCommand = mutation({
  args: { type: v.string(), payload: v.any() },
  handler: async (ctx, { type, payload }) => {
    return await ctx.db.insert("commands", {
      type,
      payload,
      status: "pending",
      createdAt: Date.now(),
    });
  },
});

export const updateCommandStatus = mutation({
  args: { id: v.id("commands"), status: v.string(), result: v.optional(v.any()) },
  handler: async (ctx, { id, status, result }) => {
    await ctx.db.patch(id, { status, result });
  },
});

export const createAuthFlow = mutation({
  args: { flowId: v.string(), phone: v.string() },
  handler: async (ctx, { flowId, phone }) => {
    return await ctx.db.insert("authFlows", {
      flowId,
      phone,
      step: "phone",
      createdAt: Date.now(),
    });
  },
});

export const updateAuthFlow = mutation({
  args: {
    flowId: v.string(),
    step: v.optional(v.string()),
    inputValue: v.optional(v.string()),
    sessionName: v.optional(v.string()),
    result: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { flowId, ...updates }) => {
    const flow = await ctx.db
      .query("authFlows")
      .withIndex("by_flowId", (q) => q.eq("flowId", flowId))
      .first();
    if (flow) {
      const patch: any = {};
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined) patch[k] = v;
      }
      await ctx.db.patch(flow._id, patch);
    }
  },
});

export const deleteAuthFlow = mutation({
  args: { flowId: v.string() },
  handler: async (ctx, { flowId }) => {
    const flow = await ctx.db
      .query("authFlows")
      .withIndex("by_flowId", (q) => q.eq("flowId", flowId))
      .first();
    if (flow) await ctx.db.delete(flow._id);
  },
});

export const setApiKey = mutation({
  args: { apiKey: v.string() },
  handler: async (ctx, { apiKey }) => {
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", "apiKey"))
      .first();
    if (existing) {
      await ctx.db.patch(existing._id, { value: apiKey });
    } else {
      await ctx.db.insert("config", { key: "apiKey", value: apiKey });
    }
  },
});

export const heartbeat = mutation({
  args: {},
  handler: async (ctx) => {
    const existing = await ctx.db
      .query("config")
      .withIndex("by_key", (q) => q.eq("key", "backendHeartbeat"))
      .first();
    const now = String(Date.now());
    if (existing) {
      await ctx.db.patch(existing._id, { value: now });
    } else {
      await ctx.db.insert("config", { key: "backendHeartbeat", value: now });
    }
  },
});
