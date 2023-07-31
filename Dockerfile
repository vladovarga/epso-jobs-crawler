FROM public.ecr.aws/lambda/nodejs:18 AS ts-builder

WORKDIR /app
COPY . .

# npm install everything, also dev - because typescript is devDependency
# and then build source code from typescript
RUN npm ci
RUN npm run build

### second stage build starting here ###

FROM public.ecr.aws/lambda/nodejs:18 AS final

# WORKDIR /app
WORKDIR ${LAMBDA_TASK_ROOT}
COPY --from=ts-builder ./app/dist ./dist
COPY package*.json .
COPY .env.example .

RUN npm ci --omit=dev \
&& echo 'alias ll="ls -la"' >> ~/.bashrc

# At container start, run this command
CMD ["dist/index.handler"]