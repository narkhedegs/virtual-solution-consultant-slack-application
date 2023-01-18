import * as dotenv from "dotenv";
dotenv.config();

import bolt from "@slack/bolt";
import { Configuration as OpenAiConfiguration, OpenAIApi } from "openai";

const { App: Application } = bolt;
const SlackUserMentionRegularExpression = /(?:\s)<@[^, ]*|(?:^)<@[^, ]*/;

const slackApplication = new Application({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  port: process.env.PORT || 3000,
});

const openAiConfiguration = new OpenAiConfiguration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openAi = new OpenAIApi(openAiConfiguration);

slackApplication.event("app_mention", async ({ event, client, logger }) => {
  try {
    const prompt = event.text
      .replace(SlackUserMentionRegularExpression, "")
      .trim();
    logger.info(`Prompt: ${prompt}`);

    const response = await openAi.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      temperature: 0,
      max_tokens: 1000,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });
    logger.info(`Response: ${JSON.stringify(response.data)}`);

    await client.chat.postMessage({
      channel: event.channel,
      text: response.data.choices[0].text,
    });
  } catch (error) {
    logger.error(error);
  }
});

(async () => {
  await slackApplication.start();

  console.log("🤖 Virtual Solution Consultant Slack application is running.");
})();
