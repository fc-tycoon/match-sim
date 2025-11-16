# Web Workers vs. Worker Threads.

We have at least three "competing" requirements here:
1) The Match Simulator, that runs in the Browser. Used to test the players "Match AI". This is sandbox environment for testing and debugging.
2) Processing matches in real time, while a player is watching. In "real-time", players could interact with the action, or be silent observers.
3) Processing matches in "headless" mode, for either "Instant Results", or simulating high detail league matches in the background.

In the browser, we have "Web Workers", in Node we have "Worker threads". Web Workers will be easier in the browser.
We will require a thin Wrapper/interface, as we will require both!
Another requirement might be to run multiple AI agents in a single "Worker thread", as it will be too costly to run 22x threads when batch processing high detail league results. If we need to process 12 matches, that would require 264 threads (12 matches x 22 players = 264)


NOTE: Let's try to leave the worker thread ideas for now! Lets just focus on getting the main simulation going.
We can implement them later, we will just make sure the AI is unable to retrieve more information than necessary.
