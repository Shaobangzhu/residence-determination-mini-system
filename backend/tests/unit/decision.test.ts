import express from "express";
import request from "supertest";
import router from "../../src/routes/decision.route";
import * as aiModule from "../../src/ai";
import * as persistenceModule from "../../src/persistence";

const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/api", router);
  return app;
};

describe("decision.route", () => {
  const generateAiExplanationSpy = jest.spyOn(
    aiModule,
    "generateAiExplanation"
  );
  const saveDecisionRecordSpy = jest.spyOn(
    persistenceModule,
    "saveDecisionRecord"
  );

  beforeEach(() => {
    generateAiExplanationSpy.mockResolvedValue(
      "Mock AI explanation from test."
    );
    saveDecisionRecordSpy.mockResolvedValue(undefined as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns decision + explanations + aiExplanation when explain=true", async () => {
    const app = createTestApp();

    const payload = {
      age: 21,
      monthsInCA: 14,
      hasCADriverLicense: true,
      registeredToVoteInCA: true,
      filesCATaxes: true,
      financiallyIndependent: false,
    };

    const res = await request(app)
      .post("/api/decide?explain=true")
      .send(payload);

    expect(res.status).toBe(200);

    // decision object exists
    expect(res.body.decision).toBeDefined();
    expect(res.body.decision.status).toBeDefined();

    // system explanation string
    expect(res.body.explanations).toEqual(expect.any(String));
    expect(res.body.explanations.length).toBeGreaterThan(0);
    // Optional: tighten this if you want
    // expect(res.body.explanations).toMatch(/System classification/i);

    // AI explanation comes from our mock
    expect(res.body.aiExplanation).toBe("Mock AI explanation from test.");

    // spies were called correctly
    expect(generateAiExplanationSpy).toHaveBeenCalledTimes(1);
    expect(saveDecisionRecordSpy).toHaveBeenCalledTimes(1);
    expect(saveDecisionRecordSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        input: expect.objectContaining({ age: 21 }),
        decision: expect.objectContaining({ status: expect.any(String) }),
        systemExplanation: expect.any(String),
        aiExplanation: "Mock AI explanation from test.",
      })
    );
  });

  it("does not crash when explain=false (but still logs record)", async () => {
    const app = createTestApp();

    const payload = {
      age: 21,
      monthsInCA: 3,
      hasCADriverLicense: false,
      registeredToVoteInCA: false,
      filesCATaxes: false,
      financiallyIndependent: false,
    };

    const res = await request(app)
      .post("/api/decide?explain=false")
      .send(payload);

    expect(res.status).toBe(200);
    expect(res.body.decision).toBeDefined();
    expect(res.body.explanations).toBeUndefined();
    expect(res.body.aiExplanation).toBeUndefined();

    expect(generateAiExplanationSpy).toHaveBeenCalledTimes(1);
    expect(saveDecisionRecordSpy).toHaveBeenCalledTimes(1);
  });
});
