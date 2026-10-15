package com.acme.salary.insights.application.model;

/**
 * @param thresholdPercent minimum absolute deviation from the peer median to count as an outlier
 */
public record OutlierCriteria(int thresholdPercent, String countryCode, Integer jobTitleId,
                              int page, int size) {

    /**
     * Peer groups smaller than this are skipped: with three people the "median" is one person's
     * salary, and flagging against it is noise rather than insight.
     */
    public static final int MIN_PEER_GROUP = 5;
}
