# Interaction design

Reference influences: [Josh Comeau](https://www.joshwcomeau.com/css/interactive-guide-to-flexbox/) for local experiments inside readable prose; [Red Blob](https://www.redblobgames.com/pathfinding/a-star/introduction.html) for progressive, linked algorithm explanations; [Brilliant](https://brilliant.org/about/) for prediction followed by explanatory feedback; [VisuAlgo](https://visualgo.net/en) for explore/play/step/back; [Runestone](https://runestone.academy/ns/books/published/thinkcspy/navhelp.html) for executable code and checks.

Each interaction needs a learning purpose: changing a side should reveal exactly which edges enter or leave the cut; changing a balance window should explain why a candidate becomes illegal; stepping KL/FM must expose candidates, locks and rollback. Keep the graph, metric panel, event log and pseudocode on the same selected state.

Offer guided defaults before custom JSON. Validate input without discarding the previous valid experiment. Comparison rows must use the same graph and explicitly show each method's balance contract. Infeasible and invalid runs must never look like successful low-cut results.

Challenges should include computation, prediction and diagnosis, with two progressive hints and a reason for the answer. Use engine-derived numbers, allow retry and identify what to revisit. Do not reveal correct answers before an attempt.

Python runs in a dedicated worker. Test the learner's actual functions, not a hidden reference substituted into the visualization. TODO/NotImplementedError is incomplete. Provide a stop control and timeout, save drafts locally, and preserve them when opening the reference.
