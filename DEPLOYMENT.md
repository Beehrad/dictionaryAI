# Deploy to Render

The Spring Boot app serves both the web interface and the translation API.
Deploy it as one Docker **Web Service**, not as a Static Site.

## Configuration

`GOOGLE_API_KEY` is required. Never commit a real API key.
Revoke and replace any keys previously committed, even in a private repository:
removing a key from the current file does not remove it from Git history.

`GEMINI_MODEL` optionally overrides the configured model. Use a model available
to your Gemini API key. Model errors can occur on translation even if startup
succeeds.

`PORT` controls the HTTP port. Render supplies this variable; locally it
defaults to `8085`.

## Push the changes

From the repository directory (`Dic`), review and commit the deployment files:

```sh
git add .gitignore .dockerignore Dockerfile DEPLOYMENT.md src/main/resources/application.properties
git diff --cached --stat
git commit -m "Configure Render deployment"
git push origin master
```

These commands assume your remote is named `origin` and your deployment branch
is `master`. Include any other intended, uncommitted application files before
committing. Do not stage local secrets.

## Render setup

1. Select **New > Web Service**, connect GitHub, and select this repository.
2. Select the branch you pushed (currently `master`) and the **Docker** runtime.
3. If `pom.xml` and `Dockerfile` are at the repository root, leave **Root
   Directory** empty. If they are inside a tracked `Dic` subdirectory, set it
   to `Dic`.
4. With that root directory, use Dockerfile path `./Dockerfile` and Docker build
   context `.`. Keep the Docker command override empty to use the image entrypoint.
5. Add environment variable `GOOGLE_API_KEY` with your new Gemini key. Optionally
   set `GEMINI_MODEL` to an available model ID. Do not put keys in the frontend.
6. Use `/` as the health check path and deploy.

Open the HTTPS URL provided by Render. The frontend calls `/ai/chat` on the same
origin, so no frontend URL changes or CORS settings are required. Microphone
permission and browser speech recognition support are still required.

Two small flag buttons switch the entire interface between German and Persian,
including status and error messages. Persian is the default and uses right-to-left layout.
The microphone language remains a separate setting; switching the interface
does not change typed text, translation results, or the selected speech language.

"Leeren" clears the input, translation, and status message while idle.
Speech recording stops explicitly when speech ends or a result arrives, and
after at most 15 seconds a stop is requested. "Aufnahme stoppen" also ends it
manually. Translation starts after the recognition service reports completion.

The `/` health check verifies the web app, not Gemini credentials or quota.
Send a translation after deployment to verify the model integration.

## Local startup

```sh
export GOOGLE_API_KEY="your-new-key"
./mvnw spring-boot:run
```

Then open `http://localhost:8085`.

## Public access

The app currently has no authentication or request limits. Anyone with the URL
can call the translation endpoint and consume your Gemini quota. Add access
control and rate limiting before sharing it widely, and configure quota limits
for your Gemini project.
