package com.acme.salary.identity.domain;

/** What a signed-in person may do. Salary data is sensitive, so writing is the exception. */
public enum Role {
    /** Maintains employee and salary data. */
    HR_MANAGER(true),
    /** Reads the directory and insights; cannot change anything. */
    HR_ANALYST(false);

    private final boolean canWrite;

    Role(boolean canWrite) {
        this.canWrite = canWrite;
    }

    public boolean canWrite() {
        return canWrite;
    }
}
