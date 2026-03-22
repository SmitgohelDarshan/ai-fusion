// import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/next";

// export const aj = arcjet({
//   key: process.env.ARCJET_KEY, // Get your site key from https://app.arcjet.com
//   rules: [
//     // Shield protects your app from common attacks e.g. SQL injection
//     shield({ mode: "DRY_RUN" }),
//     // Create a bot detection rule
//     detectBot({
//       mode: "DRY_RUN", // Blocks requests. Use "DRY_RUN" to log only
//       // Block all bots except the following
//       allow: [
//         "CATEGORY:SEARCH_ENGINE", // Google, Bing, etc
//         // Uncomment to allow these other common bot categories
//         // See the full list at https://arcjet.com/bot-list
//         //"CATEGORY:MONITOR", // Uptime monitoring services
//         //"CATEGORY:PREVIEW", // Link previews e.g. Slack, Discord
//       ],
//     }),
//     // Create a token bucket rate limit. Other algorithms are supported.
//     tokenBucket({
//       mode: "LIVE",
//       // Tracked by IP address by default, but this can be customized
//       // See https://docs.arcjet.com/fingerprints
//       //characteristics: ["ip.src"],
//       characteristics: ["userId"],
//       refillRate: 5, // Refill 5 tokens per interval
//       interval: 8640, // Refill every 1 day
//       capacity: 5, // Bucket capacity of 5 tokens
//     }),
//   ],
// });

import arcjet, { detectBot, shield, tokenBucket } from "@arcjet/next";

export const aj = arcjet({
  key: process.env.ARCJET_KEY,
  rules: [
    // 1. Set Shield to DRY_RUN to stop the "Resource Exhausted" error
    shield({ mode: "DRY_RUN" }), 
    
    // 2. Set DetectBot to DRY_RUN
    detectBot({
      mode: "DRY_RUN", 
      allow: ["CATEGORY:SEARCH_ENGINE"],
    }),

    // 3. Keep Token Bucket on LIVE
    tokenBucket({
      mode: "LIVE",
      characteristics: ["userId"],
      refillRate: 5,
      interval: 86400, 
      capacity: 5,
    }),
  ],
});