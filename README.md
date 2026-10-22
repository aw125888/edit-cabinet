# EDIT CABINET

EDIT CABINET is a detailed archive for edits that preserves their context and lets viewers discover them through the many topics they connect.

## P1: Design

[View the P1 Design Submission](p1.md)

## P2: Alpha (MVP)

- [User Journey](user-journey.md)
- [Design Notes](design-notes.md)
- [MVP Demo](MVPDemo.MOV)


## P3: Beta

[Updated User Journey](user-journey.md)
[Design Notes](p3design.md)
[Visual Design Study Slides](P3%20Visual%20Inspo.pdf)
[Visual Design Study Annotations](p3visualdesign.md)
[test-output.txt](test-output.txt)
[P3 Screen Recording](https://drive.google.com/file/d/1TotZtYvCgs4CqC6yWpQ51-fxw22_aCcu/view?usp=sharing)

### Deployed App

[Open EDIT CABINET](https://editcabinet.mit-sdg.dev)

### Testing

Install dependencies:

```bash
bun install
```

To run the automated tests against a local MongoDB, make sure `MONGODB_URL` is set and MongoDB is running, then run:

```bash
bun run test
```

To run the tests without a local MongoDB, use the temporary in-memory MongoDB:

```bash
bun run test:memory
```

Direct concept tests cover the `Posting`, `Tagging`, and `Collecting` concepts, including their actions, queries, operational principles, and rejection cases. The reusable authentication concepts are course-provided and are exercised through application-level authentication tests.

Saved test execution output: [test-output.txt](test-output.txt).