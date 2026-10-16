package com.acme.salary.employee.adapter.in.web;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.io.Writer;
import java.util.List;

/**
 * RFC 4180 CSV with spreadsheet-safety, for files HR opens in Excel.
 *
 * <ul>
 *   <li>Fields containing a comma, quote or line break are quoted; quotes are doubled.</li>
 *   <li><b>Formula injection:</b> a cell starting with {@code = + - @}, tab or carriage return is
 *       executed as a formula by Excel and Sheets ({@code =HYPERLINK(...)} can exfiltrate data).
 *       Such text cells are prefixed with an apostrophe, per OWASP. Numeric columns are written
 *       through {@link #number} and never escaped, so negative numbers stay numbers.</li>
 *   <li>A UTF-8 byte-order mark first, so Excel shows ₹, ü and é instead of mojibake.</li>
 * </ul>
 */
public final class CsvWriter {

    static final char BYTE_ORDER_MARK = '﻿';
    private static final String FORMULA_TRIGGERS = "=+-@\t\r";

    private final Writer out;

    public CsvWriter(Writer out) {
        this.out = out;
    }

    public void writeBom() {
        write(String.valueOf(BYTE_ORDER_MARK));
    }

    /** A row of cells; text cells are escaped, {@link Number} values written as-is. */
    public void row(List<?> cells) {
        StringBuilder line = new StringBuilder();
        for (int i = 0; i < cells.size(); i++) {
            if (i > 0) {
                line.append(',');
            }
            Object cell = cells.get(i);
            line.append(cell instanceof Number number ? number(number) : text(cell == null ? "" : cell.toString()));
        }
        line.append("\r\n");
        write(line.toString());
    }

    static String text(String value) {
        String safe = !value.isEmpty() && FORMULA_TRIGGERS.indexOf(value.charAt(0)) >= 0 ? "'" + value : value;
        boolean needsQuotes = safe.contains(",") || safe.contains("\"") || safe.contains("\n")
                || safe.contains("\r") || safe.startsWith("'");
        return needsQuotes ? "\"" + safe.replace("\"", "\"\"") + "\"" : safe;
    }

    static String number(Number value) {
        return value instanceof java.math.BigDecimal decimal ? decimal.toPlainString() : value.toString();
    }

    private void write(String value) {
        try {
            out.write(value);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }
}
