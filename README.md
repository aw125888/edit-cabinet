# EDIT CABINET

EDIT CABINET is a detailed archive for edits that preserves their context and lets viewers discover them through the many topics they connect.

## P1: Design

[View the P1 Design Submission](p1.md)

## P2: Alpha (MVP)

- [User Journey](user-journey.md)
- [Design Notes](design-notes.md)
- [MVP Demo](MVPDemo.MOV)


## P3: Beta

- [Updated User Journey](user-journey.md)
- [Visual Design Study Slides](P3%20Visual%20Inspo.pdf)
- [Visual Design Study Annotations](p3visualdesign.md)
- [P3 Screen Recording](https://youtu.be/5a6uJyhUMGA?si=w5SzxXwwb7_l36fX)

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