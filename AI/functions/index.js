const OpenAI = require("openai");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const credentials = require("./credentials");

admin.initializeApp();
const firestore = admin.firestore();

const openai = new OpenAI({
  apiKey: credentials.apikey.key,
});

const cors = require("cors")({ origin: true });

exports.processEmail = functions.https.onRequest(async (req, res) => {
  // Expecting POST request with JSON payload
  //if (req.method !== "POST" || !req.body || !req.body.email) {
  //  return res.status(400).json({ error: "Invalid request." });
  //}

  cors(req, res, async () => {
    const email = req.query.email;

    if (!email) {
      return res.status(400).json({ error: "email is missing." });
    }

    const prompt = `Analyze the following email content:\n\n"${email}"\n\n
    First give me the following information about the email: sender, title, summary, timestamp, 
    then Identify negative sentiments, urgency, and product-related discussions.`;

    const params = {
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo",
    };

    try {
      const process = await openai.chat.completions.create(params);

      if (!process) {
        return res.status(500).json({ error: "processing completion failed." });
      }

      await firestore.collection("processedEmails").add(process);

      res.status(200).json({ message: "processing successful", data: process });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", detail: error.message });
    }
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "GET, POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");
  });
});

// Add a new Cloud Function to fetch and display analyzed emails
exports.viewProcessedEmails = functions.https.onRequest(async (req, res) => {
  cors(req, res, async () => {
    try {
      const emailsSnapshot = await firestore
        .collection("processedEmails")
        .get();
      const emails = [];

      emailsSnapshot.forEach((doc) => {
        emails.push(doc.data());
      });

      res
        .status(200)
        .json({ message: "Fetching emails successful", data: emails });
    } catch (error) {
      res
        .status(500)
        .json({ error: "Internal Server Error", detail: error.message });
    }
  });
});

exports.analyzeEmailContent = functions.https.onRequest(async (req, res) => {
  const emailContent = req.query.emailContent;

  if (!emailContent) {
    res.status(400).json({ error: "Missing Email Content." });
    return;
  }

  const prompt = `Analyze the following email content:\n\n"${emailContent}"\n\nIdentify negative sentiments, urgency, and product-related discussions.`;

  try {
    const response = await openai.Completion.create({
      engine: "gpt-3.5-turbo",
      prompt,
      max_tokens: 150,
    });

    const analysisResults = response.choices[0].text;
    res.status(200).json({ analysisResults });
  } catch (error) {
    console.error("Error from OpenAI API:", error);
    res
      .status(500)
      .json({ error: "Internal Server Error", detail: error.message });
  }
});
