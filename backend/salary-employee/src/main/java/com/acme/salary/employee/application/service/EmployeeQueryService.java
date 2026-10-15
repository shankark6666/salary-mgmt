package com.acme.salary.employee.application.service;

import com.acme.salary.common.api.PagedResponse;
import com.acme.salary.common.exception.ResourceNotFoundException;
import com.acme.salary.employee.application.model.EmployeeSearchCriteria;
import com.acme.salary.employee.application.model.EmployeeView;
import com.acme.salary.employee.application.model.ReferenceData;
import com.acme.salary.employee.application.model.SalaryHistoryEntry;
import com.acme.salary.employee.application.port.in.EmployeeQueries;
import com.acme.salary.employee.application.port.out.EmployeeReadModel;
import com.acme.salary.employee.application.port.out.ReferenceDataRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional(readOnly = true)
public class EmployeeQueryService implements EmployeeQueries {

    private final EmployeeReadModel readModel;
    private final ReferenceDataRepository referenceData;

    public EmployeeQueryService(EmployeeReadModel readModel, ReferenceDataRepository referenceData) {
        this.readModel = readModel;
        this.referenceData = referenceData;
    }

    @Override
    public PagedResponse<EmployeeView> search(EmployeeSearchCriteria criteria) {
        return readModel.search(criteria);
    }

    @Override
    public EmployeeView get(long id) {
        return readModel.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Employee", id));
    }

    @Override
    public List<SalaryHistoryEntry> salaryHistory(long employeeId) {
        get(employeeId);
        return readModel.salaryHistory(employeeId);
    }

    @Override
    public ReferenceData referenceData() {
        return referenceData.load();
    }
}
