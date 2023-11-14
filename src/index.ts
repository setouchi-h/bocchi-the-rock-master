import fs from "fs";
import path from "path";
import { OpenAI } from "openai";
import { config } from "dotenv";
config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const updateFile = async () => {
  const filePath = path.resolve(__dirname, "./data/bocchi.txt");
  const file = await openai.files.create({
    file: fs.createReadStream(filePath),
    purpose: "assistants",
  });
  return file;
};

const createAssistant = async (fileId: string) => {
  const assistant = await openai.beta.assistants.create({
    name: "Bocchi The Rock Master",
    instructions:
      "あなたはQAチャットボットです。 ナレッジベースを使用して、ユーザーの質問に最大限に対応します。",
    tools: [{ type: "retrieval" }],
    model: "gpt-4-1106-preview",
    file_ids: [fileId],
  });
  return assistant;
};

const createThread = async () => {
  const thread = await openai.beta.threads.create();
  return thread;
};

const addMessageToThread = async (threadId: string, userMessage: string) => {
  const message = await openai.beta.threads.messages.create(threadId, {
    role: "user",
    content: userMessage,
  });
  return message;
};

const runAssistant = async (
  threadId: string,
  assistantId: string,
  additionalInstructions: string
) => {
  const run = await openai.beta.threads.runs.create(threadId, {
    assistant_id: assistantId,
    instructions: additionalInstructions,
  });
  return run;
};

const getAssistantResponse = async (threadId: string, runId: string) => {
  // 実行が完了するまで待機
  let run = await openai.beta.threads.runs.retrieve(threadId, runId);
  while (run.status !== "completed") {
    run = await openai.beta.threads.runs.retrieve(threadId, runId);
  }

  // アシスタントが追加したメッセージを取得
  const messages = await openai.beta.threads.messages.list(threadId);
  return messages;
};

const useMathTutor = async () => {
  const file = await updateFile();
  const assistant = await createAssistant(file.id);
  const thread = await createThread();
  const userMessage = "ライブハウス「STARRY」の店長は？";
  await addMessageToThread(thread.id, userMessage);
  const run = await runAssistant(
    thread.id,
    assistant.id,
    "Please address the user as Jane Doe. The user has a premium account."
  );
  const messages = await getAssistantResponse(thread.id, run.id);
  console.log(messages.data[0].content);
};

// チューターの使用を開始
useMathTutor();
