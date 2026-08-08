# Future Roadmap

This document outlines features and architectural improvements planned for future development.

## 1. File Uploads in Forms (S3 Compatible)
*   **Concept**: Allow users to upload files (images, documents) directly within SurveyJS forms.
*   **Implementation**: Use a containerized, open-source S3-compatible storage solution (like Minio) for the backend. Configure SurveyJS to push files to this bucket instead of encoding them as base64 strings in the database.

## 2. Conditional Branching in Flows
*   **Concept**: Allow workflows to branch based on logic rather than strictly following a linear path. 
*   **Considerations**: This is a complex feature that requires significant changes to the `workspace.json` schema (to support nodes and edges instead of a flat list), as well as a visual node-based editor in the builder. Deferred until linear flows are fully mature.

## 3. Discarded Features
*   **Action Step Types (Webhooks/Email)**: Too dangerous/unpredictable for the current scope.
