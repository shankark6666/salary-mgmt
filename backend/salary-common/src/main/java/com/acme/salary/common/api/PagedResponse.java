package com.acme.salary.common.api;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Stable page shape for the API, independent of Spring Data's {@link Page} serialization. */
public record PagedResponse<T>(
        List<T> content,
        int page,
        int size,
        long totalElements,
        int totalPages) {

    public static <T> PagedResponse<T> from(Page<T> page) {
        return new PagedResponse<>(page.getContent(), page.getNumber(), page.getSize(),
                page.getTotalElements(), page.getTotalPages());
    }

    public <R> PagedResponse<R> map(Function<? super T, ? extends R> mapper) {
        return new PagedResponse<>(content.stream().<R>map(mapper).toList(),
                page, size, totalElements, totalPages);
    }
}
