# Sparse Fixture Repository

This fixture intentionally omits the root documentation directory and all test
files so `cdad check` can prove that it records the negative signals correctly.
The repository still keeps several positive signals in place: a substantive
README, a lightweight agent context file, an API contract, an ADR directory,
and an existing C-DAD contract. That combination should leave the positive side
of the score intact while applying penalties for the missing docs and tests.

The result is a representative failure case for issue #25 because it exercises
the command-level reporting path, not just the lower-level scanner helper.
