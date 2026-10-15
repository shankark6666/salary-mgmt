package com.acme.salary;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

/** The boundaries from ADR-0001, enforced on every build rather than by convention. */
@AnalyzeClasses(packages = "com.acme.salary", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchitectureTest {

    @ArchTest
    static final ArchRule domainIsFrameworkFree = noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat().resideInAnyPackage(
                    "org.springframework..", "jakarta.persistence..", "org.hibernate..")
            .because("business rules must be testable without Spring or a database");

    @ArchTest
    static final ArchRule applicationDoesNotKnowAdapters = noClasses()
            .that().resideInAPackage("..application..")
            .should().dependOnClassesThat().resideInAnyPackage("..adapter..", "..infrastructure..")
            .because("use cases depend on ports, not on their implementations");

    @ArchTest
    static final ArchRule webDoesNotReachPersistence = noClasses()
            .that().resideInAPackage("..adapter.in.web..")
            .should().dependOnClassesThat().resideInAPackage("..infrastructure..")
            .because("controllers go through use cases");

    @ArchTest
    static final ArchRule domainDoesNotKnowApplication = noClasses()
            .that().resideInAPackage("..domain..")
            .should().dependOnClassesThat().resideInAnyPackage("..application..", "..adapter..",
                    "..infrastructure..");

    @ArchTest
    static final ArchRule insightsIsIndependentOfEmployee = noClasses()
            .that().resideInAPackage("com.acme.salary.insights..")
            .should().dependOnClassesThat().resideInAPackage("com.acme.salary.employee..")
            .because("modules talk to the database through their own ports, not each other's code");

    @ArchTest
    static final ArchRule employeeIsIndependentOfInsights = noClasses()
            .that().resideInAPackage("com.acme.salary.employee..")
            .should().dependOnClassesThat().resideInAPackage("com.acme.salary.insights..");

    @ArchTest
    static final ArchRule businessModulesDoNotKnowSecurity = noClasses()
            .that().resideInAnyPackage("com.acme.salary.employee..", "com.acme.salary.insights..")
            .should().dependOnClassesThat().resideInAnyPackage(
                    "com.acme.salary.identity..", "org.springframework.security..")
            .because("who is signed in reaches business code only through ports like CurrentActor");
}
