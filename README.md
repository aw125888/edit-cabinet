# EDIT CABINET

EDIT CABINET is a detailed archive for edits that preserves their context and lets viewers discover them through the many topics they connect.

## Deployed App

[Open EDIT CABINET](https://editcabinet.mit-sdg.dev)

## P1: Design

- [View the P1 Design Submission](p1.md)

## P2: Alpha (MVP)

- [User Journey](user-journey.md)
- [Design Notes](design-notes.md)
- [MVP Demo](MVPDemo.MOV)

## P3: Beta

- [Updated User Journey](user-journey.md)
- [Visual Design Study Slides](P3%20Visual%20Inspo%20.pdf)
- [Visual Design Study Annotations](p3visualdesign.md)
- [P3 Screen Recording](https://youtu.be/5a6uJyhUMGA?si=w5SzxXwwb7_l36fX)

## P4: Code Complete

- [Final Design Document](fullDesignNotebook.md)
- [Final Screen Recording](https://youtu.be/WlRAZfW2a8I?si=xjF-Mu9TVeXtB3QR)
- [Saved Test Execution Output](test-output.txt)

## Local Setup

Install dependencies:

```bash
bun install
```

Create a `.env` file with a MongoDB connection string:

```text
MONGODB_URL=your_mongodb_connection_string
```

### Build

Build the frontend:

```bash
bun run build
```

### Run

Make sure MongoDB is running and `MONGODB_URL` is set, then run:

```bash
bun run start


```

Local authentication note: When running locally, authentication through the 127.0.0.1 URL currently works only in Google Chrome.

### Test

To run the automated tests against a local MongoDB, make sure `MONGODB_URL` is set and MongoDB is running, then run:

```bash
bun run test
```

To run the tests without a local MongoDB, use the temporary in-memory MongoDB:

```bash
bun run test:memory
```

Direct concept tests cover the `Posting`, `Tagging`, and `Collecting` concepts, including their actions, queries, operational principles, and rejection cases. The reusable authentication concepts are course-provided and are exercised through application-level authentication tests.

The integration tests exercise Catalog, Search, Manage, Slot, authentication, access control, error cases, and related persistent-data behavior.

[View the saved test execution output](test-output.txt).