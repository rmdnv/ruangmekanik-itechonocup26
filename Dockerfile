FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY prisma ./prisma
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app

# Build-time env required by env.ts during `next build`
ARG NEXTAUTH_SECRET
ARG NEXT_PUBLIC_APP_URL
ARG AUTH_GOOGLE_ID
ARG AUTH_GOOGLE_SECRET
ARG RESEND_API_KEY
ARG EMAIL_FROM
ARG TURNSTILE_SECRET_KEY
ARG NEXT_PUBLIC_TURNSTILE_SITE_KEY
ARG IPINFO_TOKEN
ARG DATABASE_URL

ENV NEXTAUTH_SECRET=$NEXTAUTH_SECRET \
    NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL \
    AUTH_GOOGLE_ID=$AUTH_GOOGLE_ID \
    AUTH_GOOGLE_SECRET=$AUTH_GOOGLE_SECRET \
    RESEND_API_KEY=$RESEND_API_KEY \
    EMAIL_FROM=$EMAIL_FROM \
    TURNSTILE_SECRET_KEY=$TURNSTILE_SECRET_KEY \
    NEXT_PUBLIC_TURNSTILE_SITE_KEY=$NEXT_PUBLIC_TURNSTILE_SITE_KEY \
    IPINFO_TOKEN=$IPINFO_TOKEN \
    DATABASE_URL=$DATABASE_URL

COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3000
CMD ["npm", "start"]
