FROM node:22-alpine
WORKDIR /app
COPY package.json autonomous-chat.mjs action-previews.mjs general-strategy.mjs general-tactics.mjs bot-coach.mjs archive-access.mjs action-selections.mjs match-analysis.mjs match-logs.mjs bot-knowledge.mjs ai-chat.mjs llm-provider.mjs cards.mjs bots.mjs engine.mjs classic-skills.mjs expansion-skills.mjs extra-expansion-skills.mjs maneuver-skills.mjs chat.mjs results.mjs server.mjs ./
COPY public ./public
COPY scripts ./scripts
RUN mkdir -p /app/data && chown node:node /app/data
VOLUME ["/app/data"]
USER node
EXPOSE 3000
ENV HOST=0.0.0.0
CMD ["node", "server.mjs"]
