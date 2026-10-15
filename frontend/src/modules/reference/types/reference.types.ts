export interface Country {
  code: string;
  name: string;
  currencyCode: string;
  usdRate: number;
}

export interface Department {
  id: number;
  name: string;
}

export interface JobTitle {
  id: number;
  name: string;
  level: number;
}

export interface ReferenceData {
  countries: Country[];
  departments: Department[];
  jobTitles: JobTitle[];
  fxRatesAsOf: string;
}
