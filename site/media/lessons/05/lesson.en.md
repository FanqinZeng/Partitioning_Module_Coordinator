# Fiduccia–Mattheyses vertex moves

00:00:00.000
FM moves one vertex at a time. Keep both parts nonempty and their count difference at most 1.

00:00:10.000
A and E score highly but leave counts 1 and 4. D leads the legal candidates.

00:00:20.000
D–E becomes internal, adding gain. D–C becomes crossing and offsets some of it.

00:00:30.000
Lock D after its move. The cut drops from 12 to 9, and A becomes legal.

00:00:40.000
A contributes 6 and lowers the trial cut to 3. Add A to the locks.

00:00:50.000
The trial move of C gains −2. The pass can temporarily get worse.

00:01:00.000
The cumulative gain peaks at 9 after 2 moves.

00:01:10.000
Restore the state after the first two moves. Accept DE | ABC with cut 3.

00:01:20.000
Under strict equal counts, a single move breaks equality. A KL pair swap preserves the counts.

00:01:30.000
Change the allowed count gap and observe the legal candidates and best prefix in the lab.
