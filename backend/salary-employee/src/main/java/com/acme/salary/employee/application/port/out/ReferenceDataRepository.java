package com.acme.salary.employee.application.port.out;

import com.acme.salary.employee.application.model.ReferenceData;

public interface ReferenceDataRepository {

    ReferenceData load();

    boolean countryExists(String code);

    boolean departmentExists(int id);

    boolean jobTitleExists(int id);
}
