import { readFile } from "node:fs/promises";
import { join } from "node:path";

const REQUIRED_TOPICS = new Set([
  "identity",
  "commerce",
  "activation",
  "account",
  "topup",
  "retention",
  "signal",
  "otp",
  "esim",
  "roaming",
  "privacy",
  "support"
]);

const REQUIRED_OBSERVATION_FIELDS = [
  "engine",
  "date",
  "answer",
  "urlCitations",
  "accuracy",
  "boundary",
  "officialConfusion",
  "brandMention",
  "siteCitation",
  "referral"
];

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

export async function validateGeoQuestionSet({ rootDir }) {
  const errors = [];
  const questionSetPath = join(rootDir, "docs", "geo", "geo-question-set.json");
  const templatePath = join(rootDir, "docs", "geo", "monthly-review-template.json");
  const [questionSet, template] = await Promise.all([
    readJson(questionSetPath),
    readJson(templatePath)
  ]);

  const questions = Array.isArray(questionSet.questions) ? questionSet.questions : [];
  if (questions.length !== 30) {
    errors.push(`question set must contain exactly 30 questions; found ${questions.length}`);
  }

  const ids = questions.map((question) => question.id);
  if (new Set(ids).size !== ids.length) {
    errors.push("question IDs must be unique");
  }

  for (let index = 0; index < questions.length; index += 1) {
    const question = questions[index];
    const expectedId = `geo-${String(index + 1).padStart(2, "0")}`;
    if (question.id !== expectedId) {
      errors.push(`question ${index + 1} must use ID ${expectedId}`);
    }
    if (typeof question.prompt !== "string" || question.prompt.trim().length < 12) {
      errors.push(`${question.id ?? expectedId} must have a substantive prompt`);
    }
    if (!REQUIRED_TOPICS.has(question.topic)) {
      errors.push(`${question.id ?? expectedId} has unknown topic ${question.topic}`);
    }
    for (const field of ["evaluationFocus", "factsToVerify", "boundariesToPreserve", "siteRoutes"]) {
      if (!Array.isArray(question[field]) || question[field].length === 0) {
        errors.push(`${question.id ?? expectedId} must include non-empty ${field}`);
      }
    }
    for (const route of question.siteRoutes ?? []) {
      if (typeof route !== "string" || !route.startsWith("/") || !route.endsWith("/")) {
        errors.push(`${question.id ?? expectedId} has a non-canonical site route: ${route}`);
      }
    }
  }

  const representedTopics = new Set(questions.map((question) => question.topic));
  for (const topic of REQUIRED_TOPICS) {
    if (!representedTopics.has(topic)) {
      errors.push(`question set does not cover required topic: ${topic}`);
    }
  }

  const rules = questionSet.measurementRules ?? {};
  if (rules.criticalFactAccuracyTarget !== 1) {
    errors.push("critical fact accuracy target must be 1 (100%)");
  }
  if (rules.boundaryRetentionTarget !== 0.95) {
    errors.push("boundary retention target must be 0.95 (95%)");
  }
  if (rules.officialConfusionMaximum !== 0) {
    errors.push("official identity confusion maximum must be zero");
  }
  if (rules.noSyntheticEvidence !== true) {
    errors.push("question set must prohibit synthetic evidence");
  }

  const requiredCoverage = questionSet.requiredCoverage ?? {};
  for (const dimension of [
    "fact_accuracy",
    "boundary_preservation",
    "official_identity_confusion",
    "purchase_pause",
    "activation",
    "topup",
    "roaming",
    "otp",
    "esim",
    "privacy"
  ]) {
    const coveredIds = requiredCoverage[dimension];
    if (!Array.isArray(coveredIds) || coveredIds.length === 0) {
      errors.push(`required coverage is missing ${dimension}`);
      continue;
    }
    for (const questionId of coveredIds) {
      if (!ids.includes(questionId)) {
        errors.push(`${dimension} references unknown question ${questionId}`);
      }
    }
  }

  const templateQuestions = Array.isArray(template.questions) ? template.questions : [];
  const templateIds = templateQuestions.map((item) => item.questionId);
  if (templateQuestions.length !== 30 || JSON.stringify(templateIds) !== JSON.stringify(ids)) {
    errors.push("monthly template question IDs must exactly match the fixed 30-question set");
  }
  for (const item of templateQuestions) {
    if (!Array.isArray(item.observations) || item.observations.length !== 0) {
      errors.push(`${item.questionId ?? "unknown"} template observations must start empty`);
    }
  }

  const observationTemplate = template.observationTemplate ?? {};
  for (const field of REQUIRED_OBSERVATION_FIELDS) {
    if (!Object.hasOwn(observationTemplate, field)) {
      errors.push(`observation template is missing ${field}`);
    }
  }
  if (!Array.isArray(observationTemplate.urlCitations)) {
    errors.push("urlCitations must be an array");
  }
  const citationTemplate = template.urlCitationEntryTemplate ?? {};
  for (const field of ["url", "title", "sourceType", "accessedAt", "supportsAnswer", "notes"]) {
    if (!Object.hasOwn(citationTemplate, field)) {
      errors.push(`URL citation entry template is missing ${field}`);
    }
  }
  for (const [field, nestedKeys] of Object.entries({
    accuracy: ["rating", "criticalFactsChecked", "criticalFactsAccurate"],
    boundary: ["rating", "boundariesChecked", "boundariesPreserved"],
    officialConfusion: ["occurred"],
    brandMention: ["mentioned"],
    siteCitation: ["cited", "urls", "supportsAnswer"],
    referral: ["observed", "landingUrl", "evidenceReference"]
  })) {
    const value = observationTemplate[field];
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      errors.push(`${field} must be an object`);
      continue;
    }
    for (const nestedKey of nestedKeys) {
      if (!Object.hasOwn(value, nestedKey)) {
        errors.push(`${field} is missing ${nestedKey}`);
      }
    }
  }

  const reviewValues = Object.values(template.review ?? {});
  if (reviewValues.some((value) => value !== null)) {
    errors.push("monthly review metadata must not contain fabricated run data");
  }
  const summaryValues = Object.values(template.summary ?? {});
  if (summaryValues.some((value) => value !== null)) {
    errors.push("monthly summary must not contain fabricated measurements");
  }

  return {
    errors,
    questionCount: questions.length,
    topicCount: representedTopics.size,
    questionIds: ids
  };
}
