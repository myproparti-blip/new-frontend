// Helper function to safely get nested values with NA fallback
const safeGet = (obj, path, defaultValue = 'NA') => {
    const value = path.split('.').reduce((acc, part) => acc?.[part], obj);

    // Handle different value types
    if (value === undefined || value === null || value === '') {
        return defaultValue;
    }

    // Convert boolean to Yes/No for area checkboxes
    if (typeof value === 'boolean') {
        return value ? 'Yes' : 'No';
    }

    // If value is an object, try to extract string representation
    if (typeof value === 'object') {
        // Try common field names for document fields
        if (path === 'agreementForSale' && value.agreementForSaleExecutedName) {
            return value.agreementForSaleExecutedName;
        }
        // For other objects, convert to JSON string or return NA
        return defaultValue;
    }

    return value;
};

// Helper function to format date as d/m/yyyy
const formatDate = (dateString) => {
    if (!dateString) return 'NA';
    try {
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return dateString; // Return original if invalid
        const day = date.getDate();
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (e) {
        return dateString;
    }
};

// Helper function to extract address value from nested object or return as-is
const extractAddressValue = (address) => {
    if (!address) return '';
    // If it's an object with fullAddress property, extract it
    if (typeof address === 'object' && address.fullAddress) {
        return address.fullAddress;
    }
    // If it's already a string, return it
    if (typeof address === 'string') {
        return address;
    }
    return '';
};

// Helper function to round value to nearest 1000
const roundToNearest1000 = (value) => {
    if (!value) return 'NA';
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return value;
    return Math.round(num / 1000) * 1000;
};

// Helper function to convert number to Indian words
const numberToWords = (num) => {
    if (!num || isNaN(num)) return '';
    num = Math.round(parseFloat(num));
    if (num === 0) return 'Zero';

    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    const scales = ['', 'Thousand', 'Lac', 'Crore'];

    const convertHundreds = (n) => {
        let result = '';
        const hundred = Math.floor(n / 100);
        const remainder = n % 100;

        if (hundred > 0) result += ones[hundred] + ' Hundred ';
        if (remainder >= 20) {
            result += tens[Math.floor(remainder / 10)] + ' ' + ones[remainder % 10] + ' ';
        } else if (remainder >= 10) {
            result += teens[remainder - 10] + ' ';
        } else if (remainder > 0) {
            result += ones[remainder] + ' ';
        }
        return result;
    };

    let words = '';
    let scale = 0;

    while (num > 0 && scale < scales.length) {
        let group = num % 1000;
        if (scale === 1) group = num % 100;

        if (group > 0) {
            if (scale === 1) {
                words = convertHundreds(group).replace('Hundred', '').trim() + ' ' + scales[scale] + ' ' + words;
            } else {
                words = convertHundreds(group) + scales[scale] + ' ' + words;
            }
        }

        num = Math.floor(num / (scale === 0 ? 1000 : scale === 1 ? 100 : 1000));
        scale++;
    }

    return words.trim().toUpperCase();
};

// Helper function to calculate percentage of value
const calculatePercentage = (baseValue, percentage) => {
    if (!baseValue) return 0;
    const num = parseFloat(String(baseValue).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return 0;
    return Math.round((num * percentage) / 100);
};

// Helper function to format currency with words
const formatCurrencyWithWords = (value, percentage = 100) => {
    if (!value) return 'NA';
    const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
    if (isNaN(num)) return value;

    const finalValue = Math.round((num * percentage) / 100);
    const words = numberToWords(finalValue);
    const formatted = finalValue.toLocaleString('en-IN');

    return `₹ ${formatted}/- (${words})`;
};

// Helper function to get image dimensions and optimize for PDF
const getImageDimensions = (imageUrl) => {
    // Default dimensions
    let width = 500;
    let height = 400;

    // Ensure imageUrl is a string
    if (!imageUrl || typeof imageUrl !== 'string') {
        return { width, height };
    }

    // If image is base64 or data URI, return defaults
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
        return { width, height };
    }

    // For location images, use larger dimensions
    if (imageUrl.includes('location')) {
        return { width: 500, height: 450 };
    }

    return { width, height };
};

// Helper function to extract image URL safely
const extractImageUrl = (img) => {
    if (!img) return '';

    let url = '';

    if (typeof img === 'string') {
        url = img.trim();
    } else if (typeof img === 'object') {
        // Try multiple properties that might contain the URL
        url = (img.url || img.preview || img.data || img.src || img.secure_url || '').toString().trim();
    }

    // Validate URL format
    if (!url) return '';

    // Accept data URIs, blob URLs, and HTTP(S) URLs
    if (url.startsWith('data:') || url.startsWith('blob:') || url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }

    return '';
};

// Helper function to validate and format image for PDF
const getImageSource = (imageUrl) => {
    // Ensure imageUrl is a string
    if (!imageUrl || typeof imageUrl !== 'string') {
        return '';
    }

    // Trim whitespace
    imageUrl = imageUrl.trim();

    // Return empty if still invalid after trim
    if (!imageUrl) {
        return '';
    }

    // If already base64 or data URI, use directly
    if (imageUrl.startsWith('data:') || imageUrl.startsWith('blob:')) {
        return imageUrl;
    }

    // For regular URLs, ensure it's valid
    try {
        // Try to construct a URL - this validates the URL format
        new URL(imageUrl);
        return imageUrl;
    } catch (e) {
        console.warn('Invalid image URL:', imageUrl.substring(0, 100), e?.message);
        return '';
    }
};

// Helper function to normalize data structure - flatten nested objects from database
const normalizeDataForPDF = (data = {}) => {
    if (!data) return {};

    let normalized = { ...data };

    // If data comes from MongoDB with nested objects, flatten them
    if (data.documentInformation) {
        normalized = {
            ...normalized,
            branch: data.documentInformation.branch || normalized.branch,
            dateOfInspection: data.documentInformation.dateOfInspection || normalized.dateOfInspection,
            dateOfValuation: data.documentInformation.dateOfValuation || normalized.dateOfValuation,
            valuationPurpose: data.documentInformation.valuationPurpose || normalized.valuationPurpose,
            valuationPlace: data.documentInformation.valuationPlace || normalized.valuationPlace,
            valuationMadeDate: data.documentInformation.valuationMadeDate || data.documentInformation.dateOfValuation || normalized.valuationMadeDate
        };
    }

    if (data.ownerDetails) {
        normalized = {
            ...normalized,
            ownerNameAddress: data.ownerDetails.ownerNameAddress || normalized.ownerNameAddress,
            briefDescriptionProperty: data.ownerDetails.propertyDescription || normalized.briefDescriptionProperty
        };
    }

    if (data.locationOfProperty) {
        normalized = {
            ...normalized,
            plotSurveyNo: data.locationOfProperty.plotSurveyNo || normalized.plotSurveyNo,
            doorNo: data.locationOfProperty.doorNo || normalized.doorNo,
            tpVillage: data.locationOfProperty.tsVillage || normalized.tpVillage,
            wardTaluka: data.locationOfProperty.wardTaluka || normalized.wardTaluka,
            mandalDistrict: data.locationOfProperty.mandalDistrict || normalized.mandalDistrict,
            layoutPlanIssueDate: data.locationOfProperty.dateLayoutIssueValidity || normalized.layoutPlanIssueDate,
            approvedMapAuthority: data.locationOfProperty.approvedMapIssuingAuthority || normalized.approvedMapAuthority
        };
    }

    if (data.cityAreaType) {
        normalized = {
            ...normalized,
            cityTown: data.cityAreaType.cityTown || normalized.cityTown
        };
    }

    if (data.areaClassification) {
        normalized = {
            ...normalized,
            areaClassification: data.areaClassification.areaClassification || normalized.areaClassification,
            urbanClassification: data.areaClassification.areaType || normalized.urbanClassification,
            governmentType: data.areaClassification.govGovernance || normalized.governmentType,
            govtEnactmentsCovered: data.areaClassification.stateGovernmentEnactments || normalized.govtEnactmentsCovered
        };
    }

    // Map postal address and area fields from locationOfProperty or pdfDetails
    if (data.locationOfProperty) {
        normalized = {
            ...normalized,
            postalAddress: extractAddressValue(data.locationOfProperty.postalAddress) || normalized.postalAddress,
            residentialArea: data.locationOfProperty.residentialArea || normalized.residentialArea,
            commercialArea: data.locationOfProperty.commercialArea || normalized.commercialArea,
            industrialArea: data.locationOfProperty.industrialArea || normalized.industrialArea,
            areaClassification: data.locationOfProperty.areaClassification || normalized.areaClassification
        };
    }

    // Map authentication and verification fields from pdfDetails (highest priority)
    if (data.pdfDetails) {
        normalized = {
            ...normalized,
            authenticityVerified: data.pdfDetails.authenticityVerified || normalized.authenticityVerified,
            valuerCommentOnAuthenticity: data.pdfDetails.valuerCommentOnAuthenticity || normalized.valuerCommentOnAuthenticity,
            postalAddress: extractAddressValue(data.pdfDetails.postalAddress) || normalized.postalAddress,
            residentialArea: data.pdfDetails.residentialArea !== undefined ? data.pdfDetails.residentialArea : normalized.residentialArea,
            commercialArea: data.pdfDetails.commercialArea !== undefined ? data.pdfDetails.commercialArea : normalized.commercialArea,
            industrialArea: data.pdfDetails.industrialArea !== undefined ? data.pdfDetails.industrialArea : normalized.industrialArea,
            areaClassification: data.pdfDetails.areaClassification || normalized.areaClassification,
            apartmentCTSNo: data.pdfDetails.apartmentCTSNo || normalized.apartmentCTSNo,
            apartmentTSNo: data.pdfDetails.apartmentTSNo || normalized.apartmentTSNo,
            apartmentBlockNo: data.pdfDetails.apartmentBlockNo || normalized.apartmentBlockNo,
            apartmentWardNo: data.pdfDetails.apartmentWardNo || normalized.apartmentWardNo,
            apartmentVillageMunicipalityCounty: data.pdfDetails.apartmentVillageMunicipalityCounty || normalized.apartmentVillageMunicipalityCounty,
            apartmentDoorNoStreetRoad: data.pdfDetails.apartmentDoorNoStreetRoad || normalized.apartmentDoorNoStreetRoad,
            apartmentPinCode: data.pdfDetails.apartmentPinCode || normalized.apartmentPinCode,
            classificationPosh: data.pdfDetails.classificationPosh || normalized.classificationPosh,
            classificationUsage: data.pdfDetails.classificationUsage || normalized.classificationUsage,
            classificationOwnership: data.pdfDetails.classificationOwnership || normalized.classificationOwnership,
            ownerOccupancyStatus: data.pdfDetails.ownerOccupancyStatus || normalized.ownerOccupancyStatus,
            clientImage: data.pdfDetails.clientImage || normalized.clientImage
        };
    }

    if (data.propertyBoundaries?.plotBoundaries) {
        normalized = {
            ...normalized,
            boundariesPlotNorth: data.propertyBoundaries.plotBoundaries.north || normalized.boundariesPlotNorth,
            boundariesPlotSouth: data.propertyBoundaries.plotBoundaries.south || normalized.boundariesPlotSouth,
            boundariesPlotEast: data.propertyBoundaries.plotBoundaries.east || normalized.boundariesPlotEast,
            boundariesPlotWest: data.propertyBoundaries.plotBoundaries.west || normalized.boundariesPlotWest
        };
    }

    if (data.propertyDimensions) {
        normalized = {
            ...normalized,
            dimensionsDeed: data.propertyDimensions.dimensionsAsPerDeed || normalized.dimensionsDeed,
            dimensionsActual: data.propertyDimensions.actualDimensions || normalized.dimensionsActual,
            extentOfUnit: data.propertyDimensions.extent || normalized.extentOfUnit,
            latitudeLongitude: data.propertyDimensions.latitudeLongitudeCoordinates || normalized.latitudeLongitude,
            extentOfSiteValuation: data.propertyDimensions.extentSiteConsideredValuation || normalized.extentOfSiteValuation
        };
    }

    if (data.rateInfo) {
        normalized = {
            ...normalized,
            comparableRate: data.rateInfo.comparableRateSimilarUnit || normalized.comparableRate,
            adoptedBasicCompositeRate: data.rateInfo.adoptedBasicCompositeRate || normalized.adoptedBasicCompositeRate,
            buildingServicesRate: data.rateInfo.buildingServicesRate || normalized.buildingServicesRate,
            landOthersRate: data.rateInfo.landOthersRate || normalized.landOthersRate
        };
    }

    if (data.rateValuation) {
        normalized = {
            ...normalized,
            comparableRate: data.rateValuation.comparableRateSimilarUnitPerSqft || normalized.comparableRate,
            adoptedBasicCompositeRate: data.rateValuation.adoptedBasicCompositeRatePerSqft || normalized.adoptedBasicCompositeRate,
            buildingServicesRate: data.rateValuation.buildingServicesRatePerSqft || normalized.buildingServicesRate,
            landOthersRate: data.rateValuation.landOthersRatePerSqft || normalized.landOthersRate
        };
    }

    if (data.compositeRateDepreciation) {
        normalized = {
            ...normalized,
            depreciatedBuildingRate: data.compositeRateDepreciation.depreciatedBuildingRatePerSqft || normalized.depreciatedBuildingRate,
            replacementCostServices: data.compositeRateDepreciation.replacementCostUnitServicesPerSqft || normalized.replacementCostServices,
            buildingAge: data.compositeRateDepreciation.ageOfBuildingYears || normalized.buildingAge,
            buildingLife: data.compositeRateDepreciation.lifeOfBuildingEstimatedYears || normalized.buildingLife,
            depreciationPercentage: data.compositeRateDepreciation.depreciationPercentageSalvage || normalized.depreciationPercentage,
            deprecatedRatio: data.compositeRateDepreciation.depreciatedRatioBuilding || normalized.deprecatedRatio,
            totalCompositeRate: data.compositeRateDepreciation.totalCompositeRatePerSqft || normalized.totalCompositeRate,
            rateForLandOther: data.compositeRateDepreciation.rateLandOtherV3IIPerSqft || normalized.rateForLandOther,
            guidelineRate: data.compositeRateDepreciation.guidelineRatePerSqm || normalized.guidelineRate
        };
    }

    if (data.compositeRate) {
        normalized = {
            ...normalized,
            depreciatedBuildingRate: data.compositeRate.depreciatedBuildingRate || normalized.depreciatedBuildingRate,
            replacementCostServices: data.compositeRate.replacementCostUnitServices || normalized.replacementCostServices,
            buildingAge: data.compositeRate.ageOfBuilding || normalized.buildingAge,
            buildingLife: data.compositeRate.lifeOfBuildingEstimated || normalized.buildingLife,
            depreciationPercentage: data.compositeRate.depreciationPercentageSalvage || normalized.depreciationPercentage,
            deprecatedRatio: data.compositeRate.depreciatedRatioBuilding || normalized.deprecatedRatio,
            totalCompositeRate: data.compositeRate.totalCompositeRate || normalized.totalCompositeRate,
            rateForLandOther: data.compositeRate.rateLandOtherV3II || normalized.rateForLandOther,
            guidelineRate: data.compositeRate.guidelineRateRegistrar || normalized.guidelineRate
        };
    }

    if (data.valuationResults) {
        normalized = {
            ...normalized,
            fairMarketValue: data.valuationResults.fairMarketValue || normalized.fairMarketValue,
            fairMarketValueWords: data.valuationResults.fairMarketValueWords || normalized.fairMarketValueWords,
            realisableValue: data.valuationResults.realisableValue || data.valuationResults.realizableValue || normalized.realisableValue,
            realisableValueWords: data.valuationResults.realisableValueWords || data.valuationResults.realizableValueWords || normalized.realisableValueWords,
            distressValue: data.valuationResults.distressValue || normalized.distressValue,
            distressValueWords: data.valuationResults.distressValueWords || normalized.distressValueWords,
            agreementValue: data.valuationResults.agreementValue || normalized.agreementValue,
            agreementValueWords: data.valuationResults.agreementValueWords || normalized.agreementValueWords,
            valueCircleRate: data.valuationResults.valueCircleRate || data.valuationResults.circleRate || normalized.valueCircleRate,
            valueCircleRateWords: data.valuationResults.valueCircleRateWords || data.valuationResults.circleRateWords || normalized.valueCircleRateWords,
            saleDeedValue: data.valuationResults.saleDeedValue || normalized.saleDeedValue,
            insurableValue: data.valuationResults.insurableValue || normalized.insurableValue,
            insurableValueWords: data.valuationResults.insurableValueWords || normalized.insurableValueWords,
            rentReceivedPerMonth: data.valuationResults.rentReceivedPerMonth || normalized.rentReceivedPerMonth,
            marketability: data.valuationResults.marketability || normalized.marketability,
            valuationPlace: data.valuationResults.valuationPlace || normalized.valuationPlace,
            valuationMadeDate: data.valuationResults.valuationMadeDate || normalized.valuationMadeDate
        };
    }

    if (data.buildingConstruction) {
        normalized = {
            ...normalized,
            yearOfConstruction: data.buildingConstruction.yearOfConstruction || normalized.yearOfConstruction,
            numberOfFloors: data.buildingConstruction.numberOfFloors || normalized.numberOfFloors,
            numberOfDwellingUnits: data.buildingConstruction.numberOfDwellingUnits || normalized.numberOfDwellingUnits,
            typeOfStructure: data.buildingConstruction.typeOfStructure || normalized.typeOfStructure,
            qualityOfConstruction: data.buildingConstruction.qualityOfConstruction || normalized.qualityOfConstruction,
            appearanceOfBuilding: data.buildingConstruction.appearanceOfBuilding || normalized.appearanceOfBuilding,
            maintenanceOfBuilding: data.buildingConstruction.maintenanceOfBuilding || normalized.maintenanceOfBuilding
        };
    }

    // Map electricityService data
    if (data.electricityService) {
        normalized = {
            ...normalized,
            electricityServiceConnectionNo: data.electricityService.electricityServiceConnectionNo || normalized.electricityServiceConnectionNo,
            meterCardName: data.electricityService.meterCardName || normalized.meterCardName
        };
    }

    // Map unitTax data
    if (data.unitTax) {
        normalized = {
            ...normalized,
            assessmentNo: data.unitTax.assessmentNo || normalized.assessmentNo,
            taxPaidName: data.unitTax.taxPaidName || normalized.taxPaidName,
            taxAmount: data.unitTax.taxAmount || normalized.taxAmount
        };
    }

    // Map unitMaintenance data
    if (data.unitMaintenance) {
        normalized = {
            ...normalized,
            unitMaintenance: data.unitMaintenance.unitMaintenanceStatus || normalized.unitMaintenance
        };
    }

    // Map unitSpecifications data
    if (data.unitSpecifications) {
        normalized = {
            ...normalized,
            floorUnit: data.unitSpecifications.floorLocation || normalized.floorUnit,
            doorNoUnit: data.unitSpecifications.doorNoUnit || normalized.doorNoUnit,
            roofUnit: data.unitSpecifications.roof || normalized.roofUnit,
            flooringUnit: data.unitSpecifications.flooring || normalized.flooringUnit,
            doorsUnit: data.unitSpecifications.doors || normalized.doorsUnit,
            windowsUnit: data.unitSpecifications.windows || normalized.windowsUnit,
            fittingsUnit: data.unitSpecifications.fittings || normalized.fittingsUnit,
            finishingUnit: data.unitSpecifications.finishing || normalized.finishingUnit,
            unitBathAndWC: data.unitSpecifications.bathAndWC || normalized.unitBathAndWC,
            unitElectricalWiring: data.unitSpecifications.electricalWiring || normalized.unitElectricalWiring,
            unitWindows: data.unitSpecifications.windows || normalized.unitWindows,
            unitSpecification: data.unitSpecifications.specification || normalized.unitSpecification
        };
    }

    // Map unitAreaDetails data
    if (data.unitAreaDetails) {
        normalized = {
            ...normalized,
            undividedLandArea: data.unitAreaDetails.undividedLandAreaSaleDeed || data.unitAreaDetails.undividedLandArea || normalized.undividedLandArea,
            plinthArea: data.unitAreaDetails.plinthAreaUnit || data.unitAreaDetails.plinthArea || normalized.plinthArea,
            carpetArea: data.unitAreaDetails.carpetAreaUnit || data.unitAreaDetails.carpetArea || normalized.carpetArea
        };
    }

    // Map unitClassification data
    if (data.unitClassification) {
        normalized = {
            ...normalized,
            floorSpaceIndex: data.unitClassification.floorSpaceIndex || normalized.floorSpaceIndex,
            unitClassification: data.unitClassification.unitClassification || data.unitClassification.classification || normalized.unitClassification,
            residentialOrCommercial: data.unitClassification.residentialOrCommercial || data.unitClassification.usageType || normalized.residentialOrCommercial,
            ownerOccupiedOrLetOut: data.unitClassification.ownerOccupiedOrLetOut || data.unitClassification.occupancyType || normalized.ownerOccupiedOrLetOut,
            numberOfDwellingUnits: data.unitClassification.numberOfDwellingUnits || normalized.numberOfDwellingUnits
        };
    }

    // Map apartmentLocation data
    if (data.apartmentLocation) {
        normalized = {
            ...normalized,
            apartmentNature: data.apartmentLocation.apartmentNature || normalized.apartmentNature,
            apartmentLocation: data.apartmentLocation.apartmentLocation || data.apartmentLocation.location || normalized.apartmentLocation,
            apartmentCTSNo: data.apartmentLocation.apartmentCTSNo || data.apartmentLocation.ctsNo || data.apartmentLocation.cTSNo || normalized.apartmentCTSNo,
            apartmentTSNo: data.apartmentLocation.tsNo || data.apartmentLocation.ctsNo || data.apartmentLocation.tSNo || data.apartmentLocation.plotSurveyNo || data.apartmentLocation.apartmentCTSNo || normalized.apartmentTSNo,
            apartmentBlockNo: data.apartmentLocation.blockNo || data.apartmentLocation.block || data.apartmentLocation.blockNumber || data.apartmentLocation.apartmentBlockNo || normalized.apartmentBlockNo,
            apartmentWardNo: data.apartmentLocation.wardNo || data.apartmentLocation.ward || data.apartmentLocation.wardNumber || data.apartmentLocation.apartmentWardNo || normalized.apartmentWardNo,
            apartmentVillageMunicipalityCounty: data.apartmentLocation.villageOrMunicipality || data.apartmentLocation.village || data.apartmentLocation.municipality || data.apartmentLocation.tsVillage || data.apartmentLocation.apartmentVillageMunicipalityCounty || normalized.apartmentVillageMunicipalityCounty,
            apartmentDoorNoStreetRoad: data.apartmentLocation.doorNoStreetRoadPinCode || data.apartmentLocation.doorNo || data.apartmentLocation.streetRoad || data.apartmentLocation.street || data.apartmentLocation.doorNumber || data.apartmentLocation.roadName || data.apartmentLocation.apartmentDoorNoStreetRoad || normalized.apartmentDoorNoStreetRoad,
            apartmentPinCode: data.apartmentLocation.pinCode || data.apartmentLocation.apartmentPinCode || normalized.apartmentPinCode
        };
    }

    // Map monthlyRent data
    if (data.monthlyRent) {
        normalized = {
            ...normalized,
            monthlyRent: data.monthlyRent.ifRentedMonthlyRent || normalized.monthlyRent
        };
    }

    // Map marketability data
    if (data.marketability) {
        normalized = {
            ...normalized,
            marketability: data.marketability.howIsMarketability || normalized.marketability,
            favoringFactors: data.marketability.factorsFavouringExtraPotential || normalized.favoringFactors,
            negativeFactors: data.marketability.negativeFactorsAffectingValue || normalized.negativeFactors
        };
    }

    // Map signatureReport data
    if (data.signatureReport) {
        normalized = {
            ...normalized,
            valuationPlace: data.signatureReport.place || normalized.valuationPlace,
            valuationDate: data.signatureReport.signatureDate || normalized.valuationDate,
            valuersName: data.signatureReport.signerName || normalized.valuersName,
            reportDate: data.signatureReport.reportDate || normalized.reportDate
        };
    }

    // Map additionalFlatDetails data
    if (data.additionalFlatDetails) {
        normalized = {
            ...normalized,
            areaUsage: data.additionalFlatDetails.areaUsage || normalized.areaUsage,
            carpetArea: data.additionalFlatDetails.carpetAreaFlat || normalized.carpetArea
        };
    }

    // Map guidelineRate data
    if (data.guidelineRate) {
        normalized = {
            ...normalized,
            guidelineRate: data.guidelineRate.guidelineRatePerSqm || normalized.guidelineRate
        };
    }

    // Map images data
    if (data.propertyImages || data.locationImages || data.documentPreviews || data.areaImages || data.bankImage) {
        normalized = {
            ...normalized,
            propertyImages: data.propertyImages || normalized.propertyImages || [],
            locationImages: data.locationImages || normalized.locationImages || [],
            documentPreviews: data.documentPreviews || normalized.documentPreviews || [],
            areaImages: data.areaImages || normalized.areaImages || {},
            bankImage: data.bankImage || normalized.bankImage
        };
    }

    // Map root level fields as final fallback
    normalized = {
        ...normalized,
        carpetArea: normalized.carpetArea || data.carpetArea,
        plinthArea: normalized.plinthArea || data.plinthArea,
        floorSpaceIndex: normalized.floorSpaceIndex || data.floorSpaceIndex,
        unitClassification: normalized.unitClassification || data.unitClassification,
        residentialOrCommercial: normalized.residentialOrCommercial || data.residentialOrCommercial,
        ownerOccupiedOrLetOut: normalized.ownerOccupiedOrLetOut || data.ownerOccupiedOrLetOut,
        apartmentLocation: normalized.apartmentLocation || data.apartmentLocation || data.location,
        apartmentCTSNo: normalized.apartmentCTSNo || data.apartmentCTSNo || data.ctsNo || data.cTSNo,
        apartmentTSNo: normalized.apartmentTSNo || data.apartmentTSNo || data.ctsNo || data.tSNo || data.tsNo || data.plotSurveyNo || data.apartmentCTSNo,
        apartmentBlockNo: normalized.apartmentBlockNo || data.apartmentBlockNo || data.blockNo || data.block || data.blockNumber,
        apartmentWardNo: normalized.apartmentWardNo || data.apartmentWardNo || data.wardNo || data.ward || data.wardNumber,
        apartmentVillageMunicipalityCounty: normalized.apartmentVillageMunicipalityCounty || data.apartmentVillageMunicipalityCounty || data.village || data.municipality || data.villageOrMunicipality || data.tsVillage,
        apartmentDoorNoStreetRoad: normalized.apartmentDoorNoStreetRoad || data.apartmentDoorNoStreetRoad || data.doorNo || data.streetRoad || data.street || data.doorNumber || data.roadName,
        apartmentPinCode: normalized.apartmentPinCode || data.apartmentPinCode || data.pinCode,
        classificationPosh: normalized.classificationPosh || data.classificationPosh,
        classificationUsage: normalized.classificationUsage || data.classificationUsage,
        classificationOwnership: normalized.classificationOwnership || data.classificationOwnership,
        ownerOccupancyStatus: normalized.ownerOccupancyStatus || data.ownerOccupancyStatus,
        propertyImages: normalized.propertyImages || data.propertyImages || [],
        locationImages: normalized.locationImages || data.locationImages || [],
        documentPreviews: normalized.documentPreviews || data.documentPreviews || [],
        areaImages: normalized.areaImages || data.areaImages || {},
        bankImage: normalized.bankImage || data.bankImage
    };

    // Map document fields from documentsProduced (MongoDB structure - primary source)
    if (data.documentsProduced) {
        normalized.agreementForSale = data.documentsProduced.photocopyCopyAgreement || normalized.agreementForSale;
        normalized.commencementCertificate = data.documentsProduced.commencementCertificate || normalized.commencementCertificate;
        normalized.occupancyCertificate = data.documentsProduced.occupancyCertificate || normalized.occupancyCertificate;
    }

    // Map document fields from pdfDetails if available (fallback)
    if (data.pdfDetails) {
        normalized.agreementForSale = normalized.agreementForSale || data.pdfDetails.agreementForSale || data.pdfDetails.agreementSaleExecutedName;
        normalized.commencementCertificate = normalized.commencementCertificate || data.pdfDetails.commencementCertificate;
        normalized.occupancyCertificate = normalized.occupancyCertificate || data.pdfDetails.occupancyCertificate;
    }

    // Map document fields from agreementForSale nested object
    if (data.agreementForSale?.agreementForSaleExecutedName) {
        normalized.agreementForSale = normalized.agreementForSale || data.agreementForSale.agreementForSaleExecutedName;
    }

    // Also check root level fields (direct properties from response)
    normalized.agreementForSale = normalized.agreementForSale || data.agreementForSale;
    normalized.commencementCertificate = normalized.commencementCertificate || data.commencementCertificate;
    normalized.occupancyCertificate = normalized.occupancyCertificate || data.occupancyCertificate;

    return normalized;
};

export function generateValuationReportHTML(data = {}) {
    // Normalize data structure first - flatten nested MongoDB objects
    const normalizedData = normalizeDataForPDF(data);

    // Debug logging to verify data is being received
    console.log('🔍 PDF Data Received:', {
        hasData: !!data,
        hasRootFields: {
            uniqueId: !!data?.uniqueId,
            bankName: !!data?.bankName,
            bankImage: !!data?.bankImage,
            clientImage: !!data?.clientImage,
            clientName: !!data?.clientName,
            city: !!data?.city
        },
        hasPdfDetails: !!data?.pdfDetails,
        pdfDetailsKeys: Object.keys(data?.pdfDetails || {}).length,
        pdfDetailsSample: {
            postalAddress: data?.pdfDetails?.postalAddress,
            residentialArea: data?.pdfDetails?.residentialArea,
            areaClassification: data?.pdfDetails?.areaClassification,
            inspectionDate: data?.pdfDetails?.inspectionDate,
            agreementForSale: data?.pdfDetails?.agreementForSale,
            classificationPosh: data?.pdfDetails?.classificationPosh,
            classificationUsage: data?.pdfDetails?.classificationUsage,
            ownerOccupancyStatus: data?.pdfDetails?.ownerOccupancyStatus
        },
        hasPropertyImages: data?.propertyImages?.length || 0,
        hasBankImage: !!data?.bankImage,
        hasDocumentPreviews: data?.documentPreviews?.length || 0,
        documentPreviewsSample: data?.documentPreviews?.[0],
        normalizedKeys: Object.keys(normalizedData).length
    });

    // Start with normalized data, then merge with root level data and pdfDetails
    let pdfData = normalizedData;

    // Merge root level data first
    pdfData = {
        ...pdfData,
        ...data
    };

    // Flatten pdfDetails into root level for easier access (pdfDetails has HIGHEST priority as it contains form data)
    // This ensures ALL form fields from pdfDetails are available for the PDF template and overrides other sources
    // BUT preserve propertyImages, locationImages, documentPreviews, areaImages arrays, and bank image
    if (data?.pdfDetails && typeof data.pdfDetails === 'object') {
        const preservedPropertyImages = pdfData.propertyImages;
        const preservedLocationImages = pdfData.locationImages;
        const preservedDocumentPreviews = pdfData.documentPreviews || data.documentPreviews;
        const preservedAreaImages = pdfData.areaImages || data.areaImages;
        const preservedBankImage = data?.bankImage;
        const preservedClientImage = pdfData.clientImage || data?.clientImage;

        pdfData = {
            ...pdfData,
            ...data.pdfDetails
        };

        // Restore image arrays and bank images if they exist
        if (preservedPropertyImages) {
            pdfData.propertyImages = preservedPropertyImages;
        }
        if (preservedLocationImages) {
            pdfData.locationImages = preservedLocationImages;
        }
        if (preservedDocumentPreviews) {
            pdfData.documentPreviews = preservedDocumentPreviews;
        }
        if (preservedAreaImages) {
            pdfData.areaImages = preservedAreaImages;
        }
        if (preservedBankImage) {
            pdfData.bankImage = preservedBankImage;
        }
        if (preservedClientImage) {
            pdfData.clientImage = preservedClientImage;
        }

        // Map pdfDetails field names to template field names
        // classificationPosh -> unitClassification (for PDF template)
        if (data.pdfDetails.classificationPosh) {
            pdfData.unitClassification = data.pdfDetails.classificationPosh;
        } else if (typeof pdfData.unitClassification === 'object' && pdfData.unitClassification?.unitClassification) {
            // Extract from nested object if it exists
            pdfData.unitClassification = pdfData.unitClassification.unitClassification;
        }

        // Ensure unitMaintenance is in pdfData (should already be there from spread)
        if (data.pdfDetails.unitMaintenance) {
            pdfData.unitMaintenance = data.pdfDetails.unitMaintenance;
        } else if (typeof pdfData.unitMaintenance === 'object' && pdfData.unitMaintenance?.unitMaintenanceStatus) {
            // Extract from nested object if it exists
            pdfData.unitMaintenance = pdfData.unitMaintenance.unitMaintenanceStatus;
        }

        // DEBUG: Log field mapping
        console.log('🔧 Field Mapping Debug:', {
            allPdfDetailsKeys: Object.keys(data.pdfDetails),
            classificationPosh: data.pdfDetails.classificationPosh,
            unitMaintenance: data.pdfDetails.unitMaintenance,
            pdfDataUnitClassification: pdfData.unitClassification,
            pdfDataUnitMaintenance: pdfData.unitMaintenance,
            pdfDetailsUnitMaintenance: data.pdfDetails.unitMaintenance,
            pdfDetailsClassificationPosh: data.pdfDetails.classificationPosh
        });
    }

    // Flatten facilities object if it exists
    if (data?.facilities && typeof data.facilities === 'object') {
        pdfData = {
            ...pdfData,
            ...data.facilities
        };
    }

    // Comprehensive field name mapping for backward compatibility
    pdfData = {
        ...pdfData,
        // Basic info
        branch: pdfData.branch || pdfData.pdfDetails?.branch,
        valuationPurpose: pdfData.valuationPurpose || pdfData.pdfDetails?.valuationPurpose || pdfData.pdfDetails?.purposeOfValuation,
        referenceNo: pdfData.referenceNo || pdfData.pdfDetails?.referenceNo,
        inspectionDate: pdfData.inspectionDate || pdfData.dateOfInspection || pdfData.pdfDetails?.inspectionDate || pdfData.pdfDetails?.dateOfInspection,
        valuationMadeDate: pdfData.valuationMadeDate || pdfData.dateOfValuation || pdfData.pdfDetails?.valuationMadeDate || pdfData.pdfDetails?.dateOfValuationMade,
        agreementForSale: pdfData.agreementForSale || pdfData.pdfDetails?.agreementForSale,
        commencementCertificate: pdfData.commencementCertificate || pdfData.pdfDetails?.commencementCertificate,
        occupancyCertificate: pdfData.occupancyCertificate || pdfData.pdfDetails?.occupancyCertificate,
        ownerNameAddress: pdfData.ownerNameAddress || pdfData.pdfDetails?.ownerNameAddress || pdfData.pdfDetails?.nameOfOwnerOrOwners || pdfData.nameOfOwnerOrOwners,
        briefDescriptionProperty: pdfData.briefDescriptionProperty || pdfData.pdfDetails?.briefDescriptionProperty,

        // Location of property
        plotNo: pdfData.plotNo || pdfData.plotSurveyNo || pdfData.pdfDetails?.plotSurveyNo,
        doorNo: pdfData.doorNo || pdfData.pdfDetails?.doorNo,
        tsNoVillage: pdfData.tsNoVillage || pdfData.tpVillage || pdfData.pdfDetails?.tpVillage,
        wardTaluka: pdfData.wardTaluka || pdfData.pdfDetails?.wardTaluka,
        mandalDistrict: pdfData.mandalDistrict || pdfData.pdfDetails?.mandalDistrict,
        layoutIssueDate: pdfData.layoutIssueDate || pdfData.layoutPlanIssueDate || pdfData.pdfDetails?.layoutPlanIssueDate,
        approvedMapAuthority: pdfData.approvedMapAuthority || pdfData.pdfDetails?.approvedMapAuthority,
        mapVerified: pdfData.mapVerified || pdfData.authenticityVerified,
        valuersComments: pdfData.valuersComments || pdfData.valuerCommentOnAuthenticity,
        postalAddress: extractAddressValue(pdfData.postalAddress) || extractAddressValue(pdfData.pdfDetails?.postalAddress),
        cityTown: pdfData.cityTown || pdfData.pdfDetails?.cityTown,
        residentialArea: pdfData.residentialArea,
        commercialArea: pdfData.commercialArea,
        industrialArea: pdfData.industrialArea,
        areaClassification: pdfData.areaClassification || pdfData.pdfDetails?.areaClassification,
        urbanType: pdfData.urbanType || pdfData.urbanClassification || pdfData.pdfDetails?.urbanClassification,
        jurisdictionType: pdfData.jurisdictionType || pdfData.governmentType || pdfData.pdfDetails?.governmentType,
        enactmentCovered: pdfData.enactmentCovered || pdfData.govtEnactmentsCovered || pdfData.pdfDetails?.govtEnactmentsCovered,

        // Boundaries
        boundariesPlotNorthDeed: pdfData.boundariesPlotNorthDeed || pdfData.pdfDetails?.boundariesPlotNorthDeed,
        boundariesPlotNorthActual: pdfData.boundariesPlotNorthActual || pdfData.pdfDetails?.boundariesPlotNorthActual,
        boundariesPlotSouthDeed: pdfData.boundariesPlotSouthDeed || pdfData.pdfDetails?.boundariesPlotSouthDeed,
        boundariesPlotSouthActual: pdfData.boundariesPlotSouthActual || pdfData.pdfDetails?.boundariesPlotSouthActual,
        boundariesPlotEastDeed: pdfData.boundariesPlotEastDeed || pdfData.pdfDetails?.boundariesPlotEastDeed,
        boundariesPlotEastActual: pdfData.boundariesPlotEastActual || pdfData.pdfDetails?.boundariesPlotEastActual,
        boundariesPlotWestDeed: pdfData.boundariesPlotWestDeed || pdfData.pdfDetails?.boundariesPlotWestDeed,
        boundariesPlotWestActual: pdfData.boundariesPlotWestActual || pdfData.pdfDetails?.boundariesPlotWestActual,
        boundariesShopNorthDeed: pdfData.boundariesShopNorthDeed || pdfData.pdfDetails?.boundariesShopNorthDeed,
        boundariesShopNorthActual: pdfData.boundariesShopNorthActual || pdfData.pdfDetails?.boundariesShopNorthActual,
        boundariesShopSouthDeed: pdfData.boundariesShopSouthDeed || pdfData.pdfDetails?.boundariesShopSouthDeed,
        boundariesShopSouthActual: pdfData.boundariesShopSouthActual || pdfData.pdfDetails?.boundariesShopSouthActual,
        boundariesShopEastDeed: pdfData.boundariesShopEastDeed || pdfData.pdfDetails?.boundariesShopEastDeed,
        boundariesShopEastActual: pdfData.boundariesShopEastActual || pdfData.pdfDetails?.boundariesShopEastActual,
        boundariesShopWestDeed: pdfData.boundariesShopWestDeed || pdfData.pdfDetails?.boundariesShopWestDeed,
        boundariesShopWestActual: pdfData.boundariesShopWestActual || pdfData.pdfDetails?.boundariesShopWestActual,
        // Legacy fields for backward compatibility
        boundariesPlotNorth: pdfData.boundariesPlotNorth,
        boundariesPlotSouth: pdfData.boundariesPlotSouth,
        boundariesPlotEast: pdfData.boundariesPlotEast,
        boundariesPlotWest: pdfData.boundariesPlotWest,
        boundariesShopNorth: pdfData.boundariesShopNorth,
        boundariesShopSouth: pdfData.boundariesShopSouth,
        boundariesShopEast: pdfData.boundariesShopEast,
        boundariesShopWest: pdfData.boundariesShopWest,

        // Dimensions
        dimensionsDeed: pdfData.dimensionsDeed,
        dimensionsActual: pdfData.dimensionsActual,
        extentUnit: pdfData.extentUnit || pdfData.extent || pdfData.extentOfUnit,
        coordinates: pdfData.coordinates,
        latitudeLongitude: pdfData.latitudeLongitude,
        extentSiteValuation: pdfData.extentSiteValuation || pdfData.extentOfSiteValuation,
        floorSpaceIndex: pdfData.floorSpaceIndex,

        // Apartment Building
        apartmentNature: pdfData.apartmentNature,
        apartmentLocation: pdfData.apartmentLocation,
        newRowData: pdfData.newRowData || pdfData.newFieldName,
        apartmentCTSNo: pdfData.apartmentCTSNo || pdfData.ctsNo || pdfData.cTSNo,
        apartmentTSNo: pdfData.apartmentTSNo || pdfData.tsNo || pdfData.apartmentLocation?.tsNo || pdfData.apartmentCTSNo,
        apartmentBlockNo: pdfData.apartmentBlockNo || pdfData.blockNo,
        apartmentWardNo: pdfData.apartmentWardNo || pdfData.wardNo,
        apartmentMunicipality: pdfData.apartmentMunicipality || pdfData.apartmentVillageMunicipalityCounty || pdfData.villageOrMunicipality,
        apartmentDoorNoStreetRoad: pdfData.apartmentDoorNoStreetRoad || pdfData.apartmentDoorNoPin || pdfData.apartmentDoorNoStreetRoadPinCode || pdfData.doorNoStreetRoadPinCode || pdfData.doorNo || pdfData.streetRoad,
        apartmentPinCode: pdfData.apartmentPinCode || pdfData.pinCode,
        localityDescription: pdfData.localityDescription || pdfData.descriptionOfLocalityResidentialCommercialMixed,
        yearConstruction: pdfData.yearConstruction || pdfData.yearOfConstruction,
        numberOfFloors: pdfData.numberOfFloors,
        structureType: pdfData.structureType || pdfData.typeOfStructure,
        numberOfDwellingUnits: pdfData.numberOfDwellingUnits || pdfData.dwellingUnits || pdfData.numberOfDwellingUnitsInBuilding,
        qualityConstruction: pdfData.qualityConstruction || pdfData.qualityOfConstruction,
        buildingAppearance: pdfData.buildingAppearance || pdfData.appearanceOfBuilding,
        buildingMaintenance: pdfData.buildingMaintenance || pdfData.maintenanceOfBuilding,
        unitMaintenance: pdfData.unitMaintenance || pdfData.unitMaintenanceStatus || pdfData.pdfDetails?.unitMaintenance || data?.unitMaintenance?.unitMaintenanceStatus,
        unitClassification: pdfData.unitClassification || pdfData.pdfDetails?.classificationPosh || data?.unitClassification?.unitClassification,
        residentialOrCommercial: pdfData.residentialOrCommercial || pdfData.classificationUsage || pdfData.pdfDetails?.classificationUsage,
        ownerOccupiedOrLetOut: (() => {
            // Comprehensive check for owner occupancy status field
            const result = pdfData.ownerOccupiedOrLetOut ||
                pdfData.ownerOccupancyStatus ||
                data?.ownerOccupancyStatus ||
                pdfData.classificationOwnership ||
                pdfData.pdfDetails?.ownerOccupiedOrLetOut ||
                pdfData.pdfDetails?.ownerOccupancyStatus ||
                pdfData.pdfDetails?.classificationOwnership ||
                data?.pdfDetails?.ownerOccupancyStatus ||
                data?.unitClassification?.ownerOccupiedOrLetOut;
            console.log('⚠️ ownerOccupiedOrLetOut mapping:', {
                'pdfData.ownerOccupiedOrLetOut': pdfData.ownerOccupiedOrLetOut,
                'pdfData.ownerOccupancyStatus': pdfData.ownerOccupancyStatus,
                'data.ownerOccupancyStatus': data?.ownerOccupancyStatus,
                'pdfData.pdfDetails?.ownerOccupancyStatus': pdfData.pdfDetails?.ownerOccupancyStatus,
                'data.pdfDetails?.ownerOccupancyStatus': data?.pdfDetails?.ownerOccupancyStatus,
                finalResult: result
            });
            return result;
        })(),
        facilityLift: pdfData.facilityLift || pdfData.liftAvailable || pdfData.pdfDetails?.liftAvailable,
        facilityWater: pdfData.facilityWater || pdfData.protectedWaterSupply || pdfData.pdfDetails?.protectedWaterSupply,
        facilitySump: pdfData.facilitySump || pdfData.undergroundSewerage || pdfData.pdfDetails?.undergroundSewerage,
        facilityParking: pdfData.facilityParking || pdfData.carParkingType || pdfData.carParkingOpenCovered || pdfData.pdfDetails?.carParkingOpenCovered,
        facilityCompoundWall: pdfData.facilityCompoundWall || pdfData.compoundWall || pdfData.compoundWallExisting || pdfData.isCompoundWallExisting || pdfData.pdfDetails?.isCompoundWallExisting,
        facilityPavement: pdfData.facilityPavement || pdfData.pavement || pdfData.pavementAroundBuilding || pdfData.isPavementLaidAroundBuilding || pdfData.pdfDetails?.isPavementLaidAroundBuilding,
        facilityOthers: pdfData.facilityOthers || pdfData.othersFacility || pdfData.pdfDetails?.othersFacility,
        compoundWall: pdfData.compoundWall || pdfData.compoundWallExisting || pdfData.isCompoundWallExisting,
        pavement: pdfData.pavement || pdfData.pavementAroundBuilding || pdfData.isPavementLaidAroundBuilding,

        // Unit (with multiple name variants)
        floorUnit: pdfData.floorUnit || pdfData.floorLocation || pdfData.unitFloor || pdfData.pdfDetails?.unitFloor,
        doorNoUnit: pdfData.doorNoUnit || pdfData.unitDoorNo || pdfData.pdfDetails?.unitDoorNo,
        roofUnit: pdfData.roofUnit || pdfData.roof || pdfData.unitRoof || pdfData.pdfDetails?.unitRoof,
        flooringUnit: pdfData.flooringUnit || pdfData.flooring || pdfData.unitFlooring || pdfData.pdfDetails?.unitFlooring,
        doorsUnit: pdfData.doorsUnit || pdfData.doors || pdfData.unitDoors || pdfData.pdfDetails?.unitDoors,
        windowsUnit: pdfData.windowsUnit || pdfData.windows || pdfData.unitWindows || pdfData.pdfDetails?.unitWindows,
        unitBathAndWC: pdfData.unitBathAndWC || pdfData.bathAndWC || pdfData.pdfDetails?.unitBathAndWC,
        unitElectricalWiring: pdfData.unitElectricalWiring || pdfData.electricalWiring || pdfData.pdfDetails?.unitElectricalWiring,
        unitSpecification: pdfData.unitSpecification || pdfData.specification || pdfData.pdfDetails?.unitSpecification,
        fittingsUnit: pdfData.fittingsUnit || pdfData.fittings || pdfData.unitFittings || pdfData.pdfDetails?.unitFittings,
        finishingUnit: pdfData.finishingUnit || pdfData.finishing || pdfData.unitFinishing || pdfData.pdfDetails?.unitFinishing,
        electricityConnectionNo: pdfData.electricityConnectionNo || pdfData.electricityServiceNo || pdfData.electricityServiceConnectionNo || pdfData.pdfDetails?.electricityServiceNo || pdfData.pdfDetails?.electricityServiceConnectionNo,
        agreementForSale: pdfData.agreementForSale || pdfData.agreementSaleExecutedName || pdfData.pdfDetails?.agreementSaleExecutedName,
        undividedLandArea: pdfData.undividedLandArea || pdfData.undividedAreaLand || pdfData.undividedArea || pdfData.pdfDetails?.undividedAreaLand,
        assessmentNo: pdfData.assessmentNo || pdfData.pdfDetails?.assessmentNo || data?.unitTax?.assessmentNo,
        taxPaidName: pdfData.taxPaidName || pdfData.pdfDetails?.taxPaidName || data?.unitTax?.taxPaidName,
        taxAmount: pdfData.taxAmount || pdfData.pdfDetails?.taxAmount || data?.unitTax?.taxAmount,
        meterCardName: pdfData.meterCardName || pdfData.pdfDetails?.meterCardName || pdfData.electricityServiceConnectionNo,

        // Valuation values
        carpetArea: pdfData.carpetArea || pdfData.carpetAreaFlat || pdfData.areaUsage || pdfData.pdfDetails?.carpetAreaFlat || pdfData.pdfDetails?.areaUsage,
        areaUsage: pdfData.areaUsage || pdfData.pdfDetails?.areaUsage,
        plinthArea: pdfData.plinthArea || pdfData.pdfDetails?.plinthArea,
        undividedLandArea: pdfData.undividedLandArea || pdfData.undividedLandAreaSaleDeed || pdfData.undividedAreaLand || pdfData.pdfDetails?.undividedAreaLand,
        ratePerSqft: pdfData.ratePerSqft || pdfData.presentValueRate || pdfData.adoptedBasicCompositeRate || pdfData.pdfDetails?.presentValueRate || pdfData.pdfDetails?.adoptedBasicCompositeRate,
        fairMarketValue: pdfData.fairMarketValue || pdfData.pdfDetails?.fairMarketValue,
        fairMarketValueWords: pdfData.fairMarketValueWords || pdfData.pdfDetails?.fairMarketValueWords,
        marketValue: pdfData.marketValue || pdfData.fairMarketValue || pdfData.pdfDetails?.fairMarketValue,
        marketValueWords: pdfData.marketValueWords || pdfData.fairMarketValueWords || pdfData.pdfDetails?.fairMarketValueWords || pdfData.pdfDetails?.fairMarketValue,
        distressValue: pdfData.distressValue || pdfData.pdfDetails?.distressValue,
        distressValueWords: pdfData.distressValueWords || pdfData.pdfDetails?.distressValueWords,
        saleDeedValue: pdfData.saleDeedValue || pdfData.pdfDetails?.saleDeedValue || pdfData.bookValue || pdfData.pdfDetails?.bookValue,
        saleDeedValueWords: pdfData.saleDeedValueWords || pdfData.pdfDetails?.saleDeedValueWords || pdfData.bookValueWords || pdfData.pdfDetails?.bookValueWords,
        finalMarketValue: pdfData.finalMarketValue || pdfData.fairMarketValue || pdfData.pdfDetails?.fairMarketValue,
        finalMarketValueWords: pdfData.finalMarketValueWords || pdfData.fairMarketValueWords || pdfData.pdfDetails?.fairMarketValueWords || pdfData.pdfDetails?.fairMarketValue,
        realisableValue: pdfData.realisableValue || pdfData.realizableValue || pdfData.pdfDetails?.realizableValue || pdfData.pdfDetails?.realisableValue,
        realisableValueWords: pdfData.realisableValueWords || pdfData.pdfDetails?.realisableValueWords || pdfData.pdfDetails?.realizableValueWords || pdfData.realizableValueWords,
        finalDistressValue: pdfData.finalDistressValue || pdfData.distressValue || pdfData.pdfDetails?.distressValue,
        finalDistressValueWords: pdfData.finalDistressValueWords || pdfData.distressValueWords || pdfData.pdfDetails?.distressValueWords || pdfData.pdfDetails?.distressValue,
        readyReckonerValue: pdfData.readyReckonerValue || pdfData.totalJantriValue || pdfData.pdfDetails?.readyReckonerValue || pdfData.pdfDetails?.totalJantriValue,
        readyReckonerValueWords: pdfData.readyReckonerValueWords || pdfData.totalJantriValue || pdfData.pdfDetails?.readyReckonerValueWords || pdfData.pdfDetails?.readyReckonerValue || pdfData.pdfDetails?.totalJantriValue,
        readyReckonerYear: pdfData.readyReckonerYear || pdfData.pdfDetails?.readyReckonerYear || new Date().getFullYear(),
        insurableValue: pdfData.insurableValue || pdfData.pdfDetails?.insurableValue,
        insurableValueWords: pdfData.insurableValueWords || pdfData.pdfDetails?.insurableValueWords,
        monthlyRent: pdfData.monthlyRent || pdfData.pdfDetails?.monthlyRent,
        ownerOccupancyStatus: pdfData.ownerOccupancyStatus || pdfData.pdfDetails?.ownerOccupancyStatus,
        rentReceivedPerMonth: pdfData.rentReceivedPerMonth || pdfData.pdfDetails?.rentReceivedPerMonth || pdfData.pdfDetails?.monthlyRent,
        marketability: pdfData.marketability || pdfData.pdfDetails?.marketability,
        marketabilityRating: pdfData.marketability || pdfData.pdfDetails?.marketability,
        favoringFactors: pdfData.favoringFactors || pdfData.pdfDetails?.favoringFactors,
        negativeFactors: pdfData.negativeFactors || pdfData.pdfDetails?.negativeFactors,
        compositeRateAnalysis: pdfData.comparableRate,
        newConstructionRate: pdfData.adoptedBasicCompositeRate,

        // Signature & Report
        valuationPlace: pdfData.valuationPlace || pdfData.place || pdfData.pdfDetails?.valuationPlace,
        valuationDate: pdfData.valuationDate || pdfData.signatureDate || pdfData.pdfDetails?.valuationMadeDate,
        valuationMadeDate: pdfData.valuationMadeDate || pdfData.pdfDetails?.valuationMadeDate || pdfData.dateOfValuationMade,
        valuersName: pdfData.valuersName || pdfData.signerName || pdfData.pdfDetails?.valuersName,
        valuersCompany: pdfData.valuersCompany || pdfData.pdfDetails?.valuersCompany,
        valuersLicense: pdfData.valuersLicense || pdfData.pdfDetails?.valuersLicense,
        reportDate: pdfData.reportDate || pdfData.pdfDetails?.reportDate,

        // Rate information
        comparableRate: pdfData.comparableRate || pdfData.pdfDetails?.comparableRate,
        adoptedBasicCompositeRate: pdfData.adoptedBasicCompositeRate || pdfData.pdfDetails?.adoptedBasicCompositeRate,
        buildingServicesRate: pdfData.buildingServicesRate || pdfData.pdfDetails?.buildingServicesRate,
        landOthersRate: pdfData.landOthersRate || pdfData.pdfDetails?.landOthersRate,
        guidelineRate: pdfData.guidelineRate || pdfData.pdfDetails?.guidelineRate,

        // Dynamic Declaration Table Fields
        backgroundInfoComment: pdfData.backgroundInfoComment || pdfData.pdfDetails?.backgroundInfoComment || "Referred provided documents",
        valuationPurposeComment: pdfData.valuationPurposeComment || pdfData.pdfDetails?.valuationPurposeComment || "Continue Financial Assistance Purpose",
        valuersIdentityComment: pdfData.valuersIdentityComment || pdfData.pdfDetails?.valuersIdentityComment || "Self-assessment",
        conflictOfInterestComment: pdfData.conflictOfInterestComment || pdfData.pdfDetails?.conflictOfInterestComment || "N.A.",
        inspectionsUndertakenComment: pdfData.inspectionsUndertakenComment || pdfData.pdfDetails?.inspectionsUndertakenComment || "Yes.",
        informationSourcesComment: pdfData.informationSourcesComment || pdfData.pdfDetails?.informationSourcesComment || "Local inquiries, brokers, known websites, i.e., matches, 99acre, propertiwalai, proptiger, housing, etc., if available",
        valuationProceduresComment: pdfData.valuationProceduresComment || pdfData.pdfDetails?.valuationProceduresComment || "Land & Building Method, with Market Approach for Land and Cost Approach for Building.",
        restrictionsOnUseComment: pdfData.restrictionsOnUseComment || pdfData.pdfDetails?.restrictionsOnUseComment || "As per purpose mentioned in report.",
        majorFactorsComment: pdfData.majorFactorsComment || pdfData.pdfDetails?.majorFactorsComment || "Location of the property, with developing of surroundings, for going-purpose valuation",
        notConsideredFactorsComment: pdfData.notConsideredFactorsComment || pdfData.pdfDetails?.notConsideredFactorsComment || "Future market events and Government Policies.",
        caveatsLimitationsComment: pdfData.caveatsLimitationsComment || pdfData.pdfDetails?.caveatsLimitationsComment || "We are not responsible for Title of the subjected property and valuations affected by the same",

        // General Tab Fields from Schema
        numberingFlatBungalowPlotNo: pdfData.numberingFlatBungalowPlotNo || pdfData.pdfDetails?.numberingFlatBungalowPlotNo,
        applicant: pdfData.applicant || pdfData.pdfDetails?.applicant,
        nameOfOwnerOrOwners: pdfData.nameOfOwnerOrOwners || pdfData.pdfDetails?.nameOfOwnerOrOwners,
        typeOfProperty: pdfData.typeOfProperty || pdfData.pdfDetails?.typeOfProperty,
        typeOfStructure: pdfData.typeOfStructure || pdfData.pdfDetails?.typeOfStructure,
        statusOfTenure: pdfData.statusOfTenure || pdfData.pdfDetails?.statusOfTenure,
        accountName: pdfData.accountName || pdfData.pdfDetails?.accountName || pdfData.clientName || pdfData.borrowerName,
        nameOfOwner: pdfData.nameOfOwner || pdfData.pdfDetails?.nameOfOwner,
        client: pdfData.client || pdfData.pdfDetails?.client,
        borrowerAccountName: pdfData.borrowerAccountName || pdfData.pdfDetails?.borrowerAccountName,
        mobileNo: pdfData.mobileNo || pdfData.pdfDetails?.mobileNo,
        contactNumberOfRepresentative: pdfData.contactNumberOfRepresentative || pdfData.pdfDetails?.contactNumberOfRepresentative,
        nearbyLandmarkGoogleMap: pdfData.nearbyLandmarkGoogleMap || pdfData.pdfDetails?.nearbyLandmarkGoogleMap,
        matchingOfBoundaries: pdfData.matchingOfBoundaries || pdfData.pdfDetails?.matchingOfBoundaries,
        boundariesOfPropertyProperDemarcation: pdfData.boundariesOfPropertyProperDemarcation || pdfData.pdfDetails?.boundariesOfPropertyProperDemarcation,
        independentAccessToProperty: pdfData.independentAccessToProperty || pdfData.pdfDetails?.independentAccessToProperty,
        addressOfPropertyUnderValuation: pdfData.addressOfPropertyUnderValuation || pdfData.pdfDetails?.addressOfPropertyUnderValuation,
        adjoiningPropertiesNorthDocument: pdfData.adjoiningPropertiesNorthDocument || pdfData.pdfDetails?.adjoiningPropertiesNorthDocument,
        adjoiningPropertiesNorthSite: pdfData.adjoiningPropertiesNorthSite || pdfData.pdfDetails?.adjoiningPropertiesNorthSite,
        adjoiningPropertiesSouthDocument: pdfData.adjoiningPropertiesSouthDocument || pdfData.pdfDetails?.adjoiningPropertiesSouthDocument,
        adjoiningPropertiesSouthSite: pdfData.adjoiningPropertiesSouthSite || pdfData.pdfDetails?.adjoiningPropertiesSouthSite,
        adjoiningPropertiesEastDocument: pdfData.adjoiningPropertiesEastDocument || pdfData.pdfDetails?.adjoiningPropertiesEastDocument,
        adjoiningPropertiesEastSite: pdfData.adjoiningPropertiesEastSite || pdfData.pdfDetails?.adjoiningPropertiesEastSite,
        adjoiningPropertiesWestDocument: pdfData.adjoiningPropertiesWestDocument || pdfData.pdfDetails?.adjoiningPropertiesWestDocument,
        adjoiningPropertiesWestSite: pdfData.adjoiningPropertiesWestSite || pdfData.pdfDetails?.adjoiningPropertiesWestSite,
        dateOfInspectionOfProperty: pdfData.dateOfInspectionOfProperty || pdfData.pdfDetails?.dateOfInspectionOfProperty,
        inspectedBy: pdfData.inspectedBy || pdfData.pdfDetails?.inspectedBy,
        engagementLetterConfirmation: pdfData.engagementLetterConfirmation || pdfData.pdfDetails?.engagementLetterConfirmation,
        ownershipDocumentsSaleDeed: pdfData.ownershipDocumentsSaleDeed || pdfData.pdfDetails?.ownershipDocumentsSaleDeed,
        allotmentLetter: pdfData.allotmentLetter || pdfData.pdfDetails?.allotmentLetter,
        approvedPlan: pdfData.approvedPlan || pdfData.pdfDetails?.approvedPlan,
        briefDescriptionOfProperty: pdfData.briefDescriptionOfProperty || pdfData.pdfDetails?.briefDescriptionOfProperty,
        ageOfPropertyInYears: pdfData.ageOfPropertyInYears || pdfData.pdfDetails?.ageOfPropertyInYears,
        stageOfConstruction: pdfData.stageOfConstruction || pdfData.pdfDetails?.stageOfConstruction,
        mergedProperty: pdfData.mergedProperty || pdfData.pdfDetails?.mergedProperty,
        premiseCanBeSeparatedEntrance: pdfData.premiseCanBeSeparatedEntrance || pdfData.pdfDetails?.premiseCanBeSeparatedEntrance,
        propertyIsRentedToOtherParty: pdfData.propertyIsRentedToOtherParty || pdfData.pdfDetails?.propertyIsRentedToOtherParty,
        landIsLocked: pdfData.landIsLocked || pdfData.pdfDetails?.landIsLocked,
        ifRentedRentAgreementProvided: pdfData.ifRentedRentAgreementProvided || pdfData.pdfDetails?.ifRentedRentAgreementProvided,
        approvedLandUse: pdfData.approvedLandUse || pdfData.pdfDetails?.approvedLandUse,
        noOfYearsOfOccupancySince: pdfData.noOfYearsOfOccupancySince || pdfData.pdfDetails?.noOfYearsOfOccupancySince,
        relationshipOfTenantOrOwner: pdfData.relationshipOfTenantOrOwner || pdfData.pdfDetails?.relationshipOfTenantOrOwner,
        natureAndExtentOfViolations: pdfData.natureAndExtentOfViolations || pdfData.pdfDetails?.natureAndExtentOfViolations,
        propertyDetails: pdfData.propertyDetails || pdfData.pdfDetails?.propertyDetails,
        remarks: pdfData.remarks || pdfData.pdfDetails?.remarks,

        // Valuation Tab Fields from Schema
        purposeOfValuation: pdfData.purposeOfValuation || pdfData.pdfDetails?.purposeOfValuation,
        purposeOfProperty: pdfData.purposeOfProperty || pdfData.pdfDetails?.purposeOfProperty,
        valuationDoneByGovtApprovedValuer: pdfData.valuationDoneByGovtApprovedValuer || pdfData.pdfDetails?.valuationDoneByGovtApprovedValuer,
        dateOfValuation: pdfData.dateOfValuation || pdfData.pdfDetails?.dateOfValuation,
        dateOfValuationReport: pdfData.dateOfValuationReport || pdfData.pdfDetails?.dateOfValuationReport,
        areaOfLand: pdfData.areaOfLand || pdfData.pdfDetails?.areaOfLand,
        areaOfConstruction: pdfData.areaOfConstruction || pdfData.pdfDetails?.areaOfConstruction,
        revenueDetailsPerSaleDeed: pdfData.revenueDetailsPerSaleDeed || pdfData.pdfDetails?.revenueDetailsPerSaleDeed,
        landAreaPerSaleDeed: pdfData.landAreaPerSaleDeed || pdfData.pdfDetails?.landAreaPerSaleDeed,
        builtUpAreaPerGrudaImpactPlan: pdfData.builtUpAreaPerGrudaImpactPlan || pdfData.pdfDetails?.builtUpAreaPerGrudaImpactPlan,
        cabuaSbuaInSqFt: pdfData.cabuaSbuaInSqFt || pdfData.pdfDetails?.cabuaSbuaInSqFt,
        totalLifeOfPropertyInYears: pdfData.totalLifeOfPropertyInYears || pdfData.pdfDetails?.totalLifeOfPropertyInYears,
        ifUnderConstructionExtentOfCompletion: pdfData.ifUnderConstructionExtentOfCompletion || pdfData.pdfDetails?.ifUnderConstructionExtentOfCompletion,
        residualAgeOfPropertyInYears: pdfData.residualAgeOfPropertyInYears || pdfData.pdfDetails?.residualAgeOfPropertyInYears,
        totalNoOfFloor: pdfData.totalNoOfFloor || pdfData.pdfDetails?.totalNoOfFloor,
        floorOnWhichPropertyIsLocated: pdfData.floorOnWhichPropertyIsLocated || pdfData.pdfDetails?.floorOnWhichPropertyIsLocated,
        noOfRoomsLivingDining: pdfData.noOfRoomsLivingDining || pdfData.pdfDetails?.noOfRoomsLivingDining,
        bedRooms: pdfData.bedRooms || pdfData.pdfDetails?.bedRooms,
        noOfRoomsToiletBath: pdfData.noOfRoomsToiletBath || pdfData.pdfDetails?.noOfRoomsToiletBath,
        kitchenStore: pdfData.kitchenStore || pdfData.pdfDetails?.kitchenStore,
        location: pdfData.location || pdfData.pdfDetails?.location,
        valueOfLand: pdfData.valueOfLand || pdfData.pdfDetails?.valueOfLand,
        valueOfConstruction: pdfData.valueOfConstruction || pdfData.pdfDetails?.valueOfConstruction,
        totalMarketValueOfProperty: pdfData.totalMarketValueOfProperty || pdfData.pdfDetails?.totalMarketValueOfProperty,
        distressSaleValue: pdfData.distressSaleValue || pdfData.pdfDetails?.distressSaleValue,
        insurableValueOfProperty: pdfData.insurableValueOfProperty || pdfData.pdfDetails?.insurableValueOfProperty,
        jantriValueOfProperty: pdfData.jantriValueOfProperty || pdfData.pdfDetails?.jantriValueOfProperty,
        realisableValuePercentage: pdfData.realisableValuePercentage || pdfData.pdfDetails?.realisableValuePercentage,
        distressValuePercentage: pdfData.distressValuePercentage || pdfData.pdfDetails?.distressValuePercentage,
        buildingValueEstimatedReplacementRate: pdfData.buildingValueEstimatedReplacementRate || pdfData.pdfDetails?.buildingValueEstimatedReplacementRate,
        bookValueOfProperty: pdfData.bookValueOfProperty || pdfData.pdfDetails?.bookValueOfProperty,
        valuersOpinion: pdfData.valuersOpinion || pdfData.pdfDetails?.valuersOpinion,
        valuationBy: pdfData.valuationBy || pdfData.pdfDetails?.valuationBy,
        guidelineRateObtainedFrom: pdfData.guidelineRateObtainedFrom || pdfData.pdfDetails?.guidelineRateObtainedFrom,
        guidelineValue: pdfData.guidelineValue || pdfData.pdfDetails?.guidelineValue,
        marketValueOfProperty: pdfData.marketValueOfProperty || pdfData.pdfDetails?.marketValueOfProperty,
        dateOfReport: pdfData.dateOfReport || pdfData.pdfDetails?.dateOfReport,
        saleDeed: pdfData.saleDeed || pdfData.pdfDetails?.saleDeed,
        grudaImpactPlan: pdfData.grudaImpactPlan || pdfData.pdfDetails?.grudaImpactPlan,
        layoutPlan: pdfData.layoutPlan || pdfData.pdfDetails?.layoutPlan,
        constructionPermission: pdfData.constructionPermission || pdfData.pdfDetails?.constructionPermission,
        lightBill: pdfData.lightBill || pdfData.pdfDetails?.lightBill,
        taxBill: pdfData.taxBill || pdfData.pdfDetails?.taxBill,

        // Valuation Analysis Tab Fields from Schema
        landAreaSFT: pdfData.landAreaSFT || pdfData.pdfDetails?.landAreaSFT,
        landRate: pdfData.landRate || pdfData.pdfDetails?.landRate,
        valueOfLandPerSqFt: pdfData.valueOfLandPerSqFt || pdfData.pdfDetails?.valueOfLandPerSqFt,
        totalLandValue: pdfData.totalLandValue || pdfData.pdfDetails?.totalLandValue,
        totalBUA: pdfData.totalBUA || pdfData.pdfDetails?.totalBUA,
        dataSheet: pdfData.dataSheet || pdfData.pdfDetails?.dataSheet,
        buildingValuePlinthArea: pdfData.buildingValuePlinthArea || pdfData.pdfDetails?.buildingValuePlinthArea,
        buildingValueRoofHeight: pdfData.buildingValueRoofHeight || pdfData.pdfDetails?.buildingValueRoofHeight,
        buildingValueAge: pdfData.buildingValueAge || pdfData.pdfDetails?.buildingValueAge,
        buildingValueOfConstruction: pdfData.buildingValueOfConstruction || pdfData.pdfDetails?.buildingValueOfConstruction,
        totalBuildingValue: pdfData.totalBuildingValue || pdfData.pdfDetails?.totalBuildingValue,
        fairMarketValueInWords: pdfData.fairMarketValueInWords || pdfData.pdfDetails?.fairMarketValueInWords,
        realisableValueInWords: pdfData.realisableValueInWords || pdfData.pdfDetails?.realisableValueInWords,
        distressValueInWords: pdfData.distressValueInWords || pdfData.pdfDetails?.distressValueInWords,
        dateOfVisit: pdfData.dateOfVisit || pdfData.pdfDetails?.dateOfVisit,
        valuationReportDeclaration: pdfData.valuationReportDeclaration || pdfData.pdfDetails?.valuationReportDeclaration,
        propertyInspectionDeclaration: pdfData.propertyInspectionDeclaration || pdfData.pdfDetails?.propertyInspectionDeclaration,
        siteVisitPhotos: pdfData.siteVisitPhotos || pdfData.pdfDetails?.siteVisitPhotos,
        selfieWithOwner: pdfData.selfieWithOwner || pdfData.pdfDetails?.selfieWithOwner,
        saleInstanceLocalInquiry: pdfData.saleInstanceLocalInquiry || pdfData.pdfDetails?.saleInstanceLocalInquiry,
        brokerRecording: pdfData.brokerRecording || pdfData.pdfDetails?.brokerRecording,
        advTcrLsr: pdfData.advTcrLsr || pdfData.pdfDetails?.advTcrLsr,
        kabulatLekh: pdfData.kabulatLekh || pdfData.pdfDetails?.kabulatLekh,
        mortgageDeed: pdfData.mortgageDeed || pdfData.pdfDetails?.mortgageDeed,
        leaseDeed: pdfData.leaseDeed || pdfData.pdfDetails?.leaseDeed,
        index2: pdfData.index2 || pdfData.pdfDetails?.index2,
        vf712InCaseOfLand: pdfData.vf712InCaseOfLand || pdfData.pdfDetails?.vf712InCaseOfLand,
        naOrder: pdfData.naOrder || pdfData.pdfDetails?.naOrder,
        commencementLetter: pdfData.commencementLetter || pdfData.pdfDetails?.commencementLetter,
        buPermission: pdfData.buPermission || pdfData.pdfDetails?.buPermission,
        tentativeRate: pdfData.tentativeRate || pdfData.pdfDetails?.tentativeRate,
        pastValuationRate: pdfData.pastValuationRate || pdfData.pdfDetails?.pastValuationRate,
        subContractingDeclaration: pdfData.subContractingDeclaration || pdfData.pdfDetails?.subContractingDeclaration,
        eleMeterPhoto: pdfData.eleMeterPhoto || pdfData.pdfDetails?.eleMeterPhoto,
        muniTaxBill: pdfData.muniTaxBill || pdfData.pdfDetails?.muniTaxBill,
        place: pdfData.place || pdfData.pdfDetails?.place,

        // Depreciation & Rate
        depreciatedBuildingRateFinal: pdfData.depreciatedBuildingRateFinal || pdfData.depreciatedBuildingRate || pdfData.pdfDetails?.depreciatedBuildingRate,
        replacementCostServices: pdfData.replacementCostServices || pdfData.pdfDetails?.replacementCostServices,
        buildingAgeDepreciation: pdfData.buildingAgeDepreciation || pdfData.buildingAge || pdfData.pdfDetails?.buildingAge,
        buildingLifeEstimated: pdfData.buildingLifeEstimated || pdfData.buildingLife || pdfData.pdfDetails?.buildingLife,
        depreciationPercentageFinal: pdfData.depreciationPercentageFinal || pdfData.depreciationPercentage || pdfData.pdfDetails?.depreciationPercentage,
        depreciatedRatio: pdfData.depreciatedRatio || pdfData.deprecatedRatio || pdfData.pdfDetails?.deprecatedRatio,
        totalCompositeRate: pdfData.totalCompositeRate || pdfData.pdfDetails?.totalCompositeRate || pdfData.adoptedBasicCompositeRate,
        guidelineRate: pdfData.guidelineRate || pdfData.pdfDetails?.guidelineRate || pdfData.pdfDetails?.guidelineRatePerSqm,
        rateLandOther: pdfData.rateLandOther || pdfData.rateForLandOther || pdfData.pdfDetails?.rateForLandOther,
        totalEstimatedValue: pdfData.totalEstimatedValue || pdfData.totalValuationItems || pdfData.pdfDetails?.totalValuationItems,
        totalValueSay: pdfData.totalValueSay || pdfData.pdfDetails?.totalValueSay,

        // Valuation items - Qty/Rate/Value variants
        valuationItem1: pdfData.valuationItem1 || pdfData.presentValue || pdfData.pdfDetails?.presentValue,
        presentValueQty: pdfData.presentValueQty || pdfData.pdfDetails?.presentValueQty,
        presentValueRate: pdfData.presentValueRate || pdfData.pdfDetails?.presentValueRate,
        wardrobesQty: pdfData.wardrobesQty || pdfData.pdfDetails?.wardrobesQty,
        wardrobesRate: pdfData.wardrobesRate || pdfData.pdfDetails?.wardrobesRate,
        wardrobes: pdfData.wardrobes || pdfData.pdfDetails?.wardrobes,
        showcasesQty: pdfData.showcasesQty || pdfData.pdfDetails?.showcasesQty,
        showcasesRate: pdfData.showcasesRate || pdfData.pdfDetails?.showcasesRate,
        showcases: pdfData.showcases || pdfData.pdfDetails?.showcases,
        kitchenArrangementsQty: pdfData.kitchenArrangementsQty || pdfData.pdfDetails?.kitchenArrangementsQty,
        kitchenArrangementsRate: pdfData.kitchenArrangementsRate || pdfData.pdfDetails?.kitchenArrangementsRate,
        kitchenArrangements: pdfData.kitchenArrangements || pdfData.pdfDetails?.kitchenArrangements,
        superfineFinishQty: pdfData.superfineFinishQty || pdfData.pdfDetails?.superfineFinishQty,
        superfineFinishRate: pdfData.superfineFinishRate || pdfData.pdfDetails?.superfineFinishRate,
        superfineFinish: pdfData.superfineFinish || pdfData.pdfDetails?.superfineFinish,
        interiorDecorationsQty: pdfData.interiorDecorationsQty || pdfData.pdfDetails?.interiorDecorationsQty,
        interiorDecorationsRate: pdfData.interiorDecorationsRate || pdfData.pdfDetails?.interiorDecorationsRate,
        interiorDecorations: pdfData.interiorDecorations || pdfData.pdfDetails?.interiorDecorations,
        electricityDepositsQty: pdfData.electricityDepositsQty || pdfData.pdfDetails?.electricityDepositsQty,
        electricityDepositsRate: pdfData.electricityDepositsRate || pdfData.pdfDetails?.electricityDepositsRate,
        electricityDeposits: pdfData.electricityDeposits || pdfData.pdfDetails?.electricityDeposits,
        collapsibleGatesQty: pdfData.collapsibleGatesQty || pdfData.pdfDetails?.collapsibleGatesQty,
        collapsibleGatesRate: pdfData.collapsibleGatesRate || pdfData.pdfDetails?.collapsibleGatesRate,
        collapsibleGates: pdfData.collapsibleGates || pdfData.pdfDetails?.collapsibleGates,
        potentialValueQty: pdfData.potentialValueQty || pdfData.pdfDetails?.potentialValueQty,
        potentialValueRate: pdfData.potentialValueRate || pdfData.pdfDetails?.potentialValueRate,
        potentialValue: pdfData.potentialValue || pdfData.pdfDetails?.potentialValue,
        otherItemsQty: pdfData.otherItemsQty || pdfData.pdfDetails?.otherItemsQty,
        otherItemsRate: pdfData.otherItemsRate || pdfData.pdfDetails?.otherItemsRate,
        otherItems: pdfData.otherItems || pdfData.pdfDetails?.otherItems,
        totalValuationItems: pdfData.totalValuationItems || pdfData.pdfDetails?.totalValuationItems,

        // Valuation Details Table
        valuationDetailsTable: pdfData.valuationDetailsTable || pdfData.pdfDetails?.valuationDetailsTable,
        classificationPosh: pdfData.unitClassification || pdfData.classificationPosh || pdfData.pdfDetails?.classificationPosh,
        classificationUsage: pdfData.classificationUsage || pdfData.pdfDetails?.classificationUsage,
        classificationOwnership: pdfData.classificationOwnership || pdfData.pdfDetails?.classificationOwnership,

        // Client & Document info
        clientName: pdfData.clientName,
        mobileNumber: pdfData.mobileNumber,
        address: pdfData.address,
        bankName: pdfData.bankName,
        bankImage: pdfData.bankImage,
        clientImage: pdfData.clientImage || pdfData.bankImage,
        city: pdfData.city,
        dsa: pdfData.dsa,
        engineerName: pdfData.engineerName,
        notes: pdfData.notes,

        // Images
        propertyImages: pdfData.propertyImages || [],
        locationImages: pdfData.locationImages || [],

        // Custom Fields
        customFields: pdfData.customFields || []
    };

    // Debug: Log critical fields for troubleshooting
    console.log('🔍 PDF Field Extraction Debug:', {
        areaClassification: pdfData.areaClassification,
        postalAddress: pdfData.postalAddress,
        postalAddressRaw: data?.postalAddress,
        pdfDetailsPostalAddress: data?.pdfDetails?.postalAddress,
        cityTown: pdfData.cityTown,
        urbanType: pdfData.urbanType
    });

    // DEBUG: Log final pdfData before rendering
    console.log('📋 Final pdfData before HTML rendering:', {
        unitMaintenance: pdfData.unitMaintenance,
        unitClassification: pdfData.unitClassification,
        classificationPosh: pdfData.classificationPosh,
        safeGetTest_unitMaintenance: safeGet(pdfData, 'unitMaintenance'),
        safeGetTest_unitClassification: safeGet(pdfData, 'unitClassification'),
        bankImage: pdfData.bankImage ? 'EXISTS' : 'MISSING',
        clientImage: pdfData.clientImage ? 'EXISTS' : 'MISSING',
        bankImageValue: pdfData.bankImage,
        clientImageValue: pdfData.clientImage
    });

    // Calculate total valuation items if not provided
    if (!pdfData.totalValuationItems || pdfData.totalValuationItems === 'NA') {
        let total = 0;
        const valuationFields = [
            'presentValue', 'wardrobes', 'showcases', 'kitchenArrangements',
            'superfineFinish', 'interiorDecorations', 'electricityDeposits',
            'collapsibleGates', 'potentialValue', 'otherItems'
        ];

        valuationFields.forEach(field => {
            const value = pdfData[field];
            if (value && value !== 'NA' && value !== 'Nil') {
                const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
                if (!isNaN(num)) total += num;
            }
        });

        if (total > 0) {
            pdfData.totalValuationItems = Math.round(total).toLocaleString('en-IN');
            pdfData.totalValuationItemsWords = numberToWords(Math.round(total)) + ' ONLY';
        }
    } else {
        // Generate words for existing total if not already provided
        if (!pdfData.totalValuationItemsWords || pdfData.totalValuationItemsWords === 'NA') {
            const num = parseFloat(String(pdfData.totalValuationItems).replace(/[^0-9.-]/g, ''));
            if (!isNaN(num)) {
                pdfData.totalValuationItemsWords = numberToWords(Math.round(num)) + ' ONLY';
            }
        }
    }

    // Generate word representations for all valuation values
    const valueFields = {
        fairMarketValue: 'fairMarketValueWords',
        realisableValue: 'realisableValueWords',
        distressValue: 'distressValueWords',
        agreementValue: 'agreementValueWords',
        valueCircleRate: 'valueCircleRateWords',
        insurableValue: 'insurableValueWords'
    };

    Object.entries(valueFields).forEach(([valueField, wordField]) => {
        const value = pdfData[valueField];
        if (value && value !== 'NA' && value !== 'Nil' && (!pdfData[wordField] || pdfData[wordField] === 'NA')) {
            const num = parseFloat(String(value).replace(/[^0-9.-]/g, ''));
            if (!isNaN(num) && num > 0) {
                pdfData[wordField] = 'Rupees ' + numberToWords(Math.round(num)) + ' Only';
            }
        }
    });

    return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>Valuation Report</title>
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      html { height: 100%; }
      body { 
        font-family: 'Arial', sans-serif; 
        font-size: 12pt; 
        line-height: 1.2; 
        color: #000;
        margin: 0;
        padding: 0;
        background: white;
      }
      @page {
        size: A4;
        margin: 12mm;
        padding: 0;
        border: none;
      }
      
      /* PDF Page Container System */
      .continuous-wrapper {
        display: block;
        width: 100%;
        margin: 0;
        padding: 0;
        background: white;
      }

      /* Individual Page Container */
      .pdf-page {
        width: 210mm;
        height: auto;
        margin: 0;
        padding: 12mm;
        background: white;
        page-break-after: always;
        break-after: page;
        position: relative;
        box-sizing: border-box;
        overflow: visible;
        display: block;
      }
      
      /* Header (40mm height) */
      .pdf-header {
        position: relative;
        top: 0;
        left: 0;
        width: 100%;
        height: auto;
        padding: 10mm 12mm;
        background: white;
        border-bottom: 1px solid #ddd;
        box-sizing: border-box;
        z-index: 10;
        overflow: visible;
      }
      
      /* Footer (40mm height) */
      .pdf-footer {
        position: relative;
        bottom: 0;
        left: 0;
        width: 100%;
        height: auto;
        padding: 10mm 12mm;
        background: white;
        border-top: 1px solid #ddd;
        box-sizing: border-box;
        z-index: 10;
        overflow: visible;
      }
      
      /* Content Area (between header and footer) */
      .pdf-content {
        position: relative;
        top: 0;
        left: 0;
        width: 100%;
        height: auto;
        overflow-y: visible;
        overflow-x: hidden;
        padding: 0 12mm;
        box-sizing: border-box;
        background: white;
      }

      .page { 
        page-break-after: always;
        break-after: page;
        padding: 12mm;
        background: white; 
        width: 100%;
        max-width: 100%;
        box-sizing: border-box;
        overflow: visible;
        display: block;
        clear: both;
        margin: 0;
        page-break-inside: avoid;
      }

      .form-table {
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
        margin: 12px 0;
        font-size: 11pt;
        table-layout: fixed;
        page-break-inside: avoid;
        break-inside: avoid;
        display: table;
        clear: both;
        max-width: 100%;
        overflow: visible;
      }

      .form-table.fixed-cols {
        table-layout: fixed;
      }

      .form-table tbody {
        display: table-row-group;
        width: 100%;
        page-break-inside: avoid;
        break-inside: avoid;
      }

      /* Keep table rows together on same page */
      .form-table tr {
        display: table-row;
        page-break-inside: avoid;
        break-inside: avoid;
        height: auto;
        page-break-before: auto;
      }

      .form-table tr:first-child {
        page-break-inside: avoid;
        break-inside: avoid;
        page-break-before: auto;
      }

      .form-table.compact tr {
        height: auto;
        min-height: 18px;
        page-break-inside: auto;
        break-inside: auto;
      }

      .form-table.compact td {
        padding: 8px 10px;
        min-height: 18px;
      }

      /* Hide/Show classes for screen vs print */
      .hide-on-screen {
        display: none !important;
      }

      .show-on-print {
        display: none !important;
      }

      @media print {
        .hide-on-screen {
          display: block !important;
        }

        .show-on-print {
          display: block !important;
        }

        .hide-on-print {
          display: none !important;
        }
      }

      .form-table td {
        border: 1px solid #000;
        padding: 6px 8px;
        vertical-align: top;
        color: #000;
        background: white;
        page-break-inside: avoid;
        break-inside: avoid;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        overflow: visible;
        height: auto;
        min-height: 18px;
        font-weight: normal;
        font-size: 10pt;
        line-height: 1.2;
      }

      /* Header row - normal padding */
      .form-table tr:first-child td {
        border: 1px solid #000;
        min-height: auto;
        height: auto;
        padding: 6px 8px;
        vertical-align: middle;
        font-weight: normal;
        font-size: 10pt;
        page-break-inside: avoid;
      }

      .form-table tr:first-child td:first-child {
        border-left: 1px solid #000;
      }

      .form-table tr:first-child td:last-child {
        border-right: 1px solid #000;
      }

      /* Left and right edges */
      .form-table td:first-child {
        border-left: 1px solid #000;
      }

      .form-table td:last-child {
        border-right: 1px solid #000;
      }

      /* Bottom row */
      .form-table tr:last-child td {
        border-bottom: 1px solid #000;
      }

      .form-table .row-num {
        width: 8%;
        min-width: 8%;
        max-width: 8%;
        text-align: center;
        font-weight: normal;
        background: #ffffff;
        padding: 6px 6px;
        vertical-align: top;
        border: 1px solid #000;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        overflow: visible;
        height: auto;
        font-size: 10pt;
      }

      .form-table .label {
        width: 45%;
        min-width: 45%;
        max-width: 45%;
        font-weight: normal;
        background: #ffffff;
        border: 1px solid #000;
        word-wrap: break-word;
        overflow-wrap: break-word;
        vertical-align: top;
        padding: 6px 8px;
        white-space: normal;
        page-break-inside: avoid;
        break-inside: avoid;
        height: auto;
        word-break: break-word;
        overflow: visible;
        font-size: 10pt;
        line-height: 1.2;
      }

        .form-table .value {
          width: 55%;
          min-width: 55%;
          max-width: 55%;
          text-align: left;
          background: white;
          border: 1px solid #000;
          word-wrap: break-word;
          overflow-wrap: break-word;
          word-break: break-word;
          vertical-align: top;
          padding: 6px 8px;
          white-space: normal;
          page-break-inside: avoid;
          break-inside: avoid;
          height: auto;
          overflow: visible;
          font-weight: normal;
          font-size: 10pt;
          line-height: 1.2;
        }

      .header { 
        text-align: center; 
        margin-bottom: 15px; 
        font-weight: bold;
        font-size: 12pt;
      }

      /* Section wrapper for floor data (GR, etc) */
      .floor-section {
        page-break-inside: avoid;
        break-inside: avoid;
        margin-bottom: 12px;
        padding: 0;
      }

      .floor-section:last-child {
        page-break-after: auto;
        break-after: auto;
      }

      /* 4-column table support for boundaries */
      .form-table.four-col td {
        border: 1px solid #000;
        padding: 8px 10px;
        vertical-align: top;
        color: #000;
        background: white;
        page-break-inside: avoid;
        break-inside: avoid;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        overflow: visible;
        height: auto;
        font-size: 11pt;
      }

      .form-table.four-col .row-num {
        width: 10%;
        min-width: 10%;
        max-width: 10%;
        border: 1px solid #000;
        padding: 6px 6px;
        font-size: 10pt;
      }

      .form-table.four-col .label {
        width: 30%;
        min-width: 30%;
        max-width: 30%;
        border: 1px solid #000;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto;
        overflow: visible;
        vertical-align: top;
        padding: 6px 8px;
        font-size: 10pt;
      }

      .form-table.four-col .deed {
        width: 30%;
        min-width: 30%;
        max-width: 30%;
        text-align: center;
        font-weight: normal;
        font-size: 10pt;
        border: 1px solid #000;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto;
        overflow: visible;
        vertical-align: top;
        padding: 6px 8px;
      }

      .form-table.four-col .actual {
        width: 30%;
        min-width: 30%;
        max-width: 30%;
        text-align: center;
        font-weight: normal;
        font-size: 10pt;
        border: 1px solid #000;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto;
        overflow: visible;
        vertical-align: top;
        padding: 6px 8px;
      }

      /* Standalone deed and actual for non-four-col tables */
      .form-table .deed {
        width: 25%;
        min-width: 25%;
        max-width: 25%;
        text-align: center;
        font-weight: normal;
        font-size: 10pt;
        border: 1px solid #000;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto;
        overflow: visible;
        vertical-align: top;
        padding: 6px 8px;
      }

      .form-table .actual {
        width: 25%;
        min-width: 25%;
        max-width: 25%;
        text-align: center;
        font-weight: normal;
        font-size: 10pt;
        border: 1px solid #000;
        white-space: normal;
        word-wrap: break-word;
        overflow-wrap: break-word;
        word-break: break-word;
        hyphens: auto;
        height: auto;
        overflow: visible;
        vertical-align: top;
        padding: 6px 8px;
      }

      /* For rows with deed/actual columns, label should be narrower */
      tr:has(td.deed) .label,
      tr:has(td.actual) .label {
        width: 25%;
        min-width: 25%;
        max-width: 25%;
      }

    
    </style>
  </head>
  <body>

  <!-- CONTINUOUS DATA TABLE -->
  <div class="continuous-wrapper" >
    <div style="padding: 0 12mm; padding-top: 5mm;">
      
      <!-- Property Details Table -->
      <div style="text-align: center; margin-bottom: 15px;">
        <p style="font-size: 20pt; font-weight: bold; margin: 0; text-decoration: underline; color: #4472C4;">VALUATION REPORT</p>
      </div>
      
      <table class="form-table" style="border-collapse: collapse; border: 1px solid #000; margin-bottom: 20px; width: 100%;">
        <tr style=";">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Account Name</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; ; font-weight: bold; font-size: 11pt;">${safeGet(pdfData, 'accountName')}</td>
        </tr>
        <tr style=";">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Name of Owner</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; ; font-weight: bold; font-size: 11pt;">${safeGet(pdfData, 'nameOfOwnerOrOwners', safeGet(pdfData, 'ownerNameAddress', 'NA'))}</td>
        </tr>
        <tr style="background: #ffffff;">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Client</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; font-weight: bold; font-size: 11pt;">${safeGet(pdfData, 'client', safeGet(pdfData, 'bankName', 'SBI'))}</td>
          </tr>
        <tr style=";">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Property Details</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; ; font-weight: bold; font-size: 11pt;">${safeGet(pdfData, 'propertyDetails', 'Residential Property')}</td>
        </tr>
        <tr style="background: #ffffff;">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Location</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; font-weight: bold; font-size: 11pt;">${safeGet(pdfData, 'postalAddress', safeGet(pdfData, 'addressOfPropertyUnderValuation', 'NA'))}</td>
        </tr>
        <tr style=";">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Purpose of Property</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; ; font-weight: bold; font-size: 11pt;">${safeGet(pdfData, 'purposeOfProperty', 'Continue Financial Assistance Purpose')}</td>
        </tr>
        <tr style="background: #ffffff;">
          <td style="border: 1px solid #000; padding: 8px 10px; font-weight: bold; width: 30%; font-size: 11pt;">Date of Valuation</td>
          <td style="border: 1px solid #000; padding: 8px 10px; width: 70%; font-weight: bold; font-size: 11pt;">${formatDate(safeGet(pdfData, 'dateOfValuation', safeGet(pdfData, 'inspectionDate')))}</td>
        </tr>
      </table>

      <!-- Bank Image Below Table -->
      <div class="image-container" style="text-align: center; margin-top: 10px; margin-bottom: 0px;">
        ${safeGet(pdfData, 'bankImage') ? `<img src="${getImageSource(safeGet(pdfData, 'bankImage'))}" alt="Bank Logo" style="max-width: 90%; height: auto; max-width: 700px; display: block; margin: 0 auto; border: none; background: #f5f5f5; padding: 10px;" class="pdf-image" crossorigin="anonymous" />` : ''}
      </div>
      
    

    <!-- ================= TITLE (CENTERED) ================= -->
    <div style="text-align:center; margin-top: 70px; box-sizing:border-box;">
      <p style="font-size:16pt; font-weight:bold;  color:#4472C4;">
        VALUED PROPERTY AT A GLANCE WITH VALUATION CERTIFICATE
      </p>
    </div>
    <div style=" box-sizing:border-box;">
    <table class="form-table"
      style="width:100%; border-collapse: collapse; font-family: Arial, sans-serif; font-size:11pt; border:1px solid #000; margin:0; padding:0; box-sizing: border-box; page-break-inside: avoid;">
      <tr>
        <td style="border:1px solid #000; padding:8px; width:35%; font-weight:bold;">
          Applicant
        </td>
        <td style="border:1px solid #000; padding:8px; width:65%; font-weight:bold;">
          ${safeGet(pdfData, 'bankName')}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          Valuation done by Govt. Approved Valuer
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${safeGet(
          pdfData,
          'valuationDoneByGovtApprovedValuer',
          "IBBI Regd. & Govt. Approved Valuer & Bank's Panel Valuer"
      )}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          Purpose of Valuation
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          To ascertain fair market value for
          <em>${safeGet(pdfData, 'purposeOfValuation', 'Continue Financial Assistance Purpose')}</em>
          (My opinion for the probable value of the property only)
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          Borrower Account Name
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${safeGet(pdfData, 'accountName', safeGet(pdfData, 'borrowerAccountName', 'NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          Name of Owner / Owners
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${safeGet(pdfData, 'nameOfOwnerOrOwners', safeGet(pdfData, 'ownerNameAddress', 'NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          Address of property under valuation
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${safeGet(pdfData, 'postalAddress', 'NA')}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          Brief description of the Property
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${safeGet(pdfData, 'briefDescriptionProperty', 'NA')}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          Revenue details as per Sale deed / Authenticate Documents
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          FP No. 151, TPS No. 29, Sub Plot No. 9/P, Sur. No. 88/1,
          Mouje: Naranpura, Ta. City, Dist. Ahmedabad.
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          Area of Land
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          As per GRUDA Impact Plan:<br>
          Net Plot Area = ${safeGet(pdfData, 'areaOfLand', 'NA')}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          Value of Land
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${formatCurrencyWithWords(safeGet(pdfData, 'valueOfLand', 'NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          Area of Construction
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${safeGet(pdfData, 'areaOfConstruction', 'NA')}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          Value of Construction
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${formatCurrencyWithWords(safeGet(pdfData, 'valueOfConstruction', 'NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          TOTAL MARKET VALUE OF THE PROPERTY
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${formatCurrencyWithWords(
          safeGet(pdfData, 'totalMarketValueOfProperty',
              safeGet(pdfData, 'marketValue', 'NA'))
      )}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          REALISABLE VALUE (90% of MV)
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${formatCurrencyWithWords(safeGet(pdfData, 'realisableValue', 'NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          DISTRESS SALE VALUE (80% of MV)
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${formatCurrencyWithWords(
          safeGet(pdfData, 'distressSaleValue',
              safeGet(pdfData, 'distressValue', 'NA'))
      )}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          JANTRI VALUE OF PROPERTY
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${formatCurrencyWithWords(safeGet(pdfData, 'jantriValueOfProperty', 'NA'))}
        </td>
      </tr>

      <tr>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          INSURABLE VALUE OF PROPERTY
        </td>
        <td style="border:1px solid #000; padding:8px; font-weight:bold;">
          ${formatCurrencyWithWords(
          safeGet(pdfData, 'insurableValueOfProperty',
              safeGet(pdfData, 'insurableValue', 'NA'))
      )}
        </td>
      </tr>

      <tr>
        <td style="border:none; padding:8px; font-weight:bold;">
          Date:
          ${formatDate(
          pdfData.reportDate ||
          pdfData.valuationDate ||
          safeGet(pdfData, 'valuationMadeDate', 'NA')
      )}
        </td>
        <td style="border:none; padding:8px; font-weight:bold; text-align:right;">
          ${pdfData.valuersName || 'Valuer Name'}<br>
          Govt. Registered Valuer
        </td>
      </tr>

      <tr>
        <td style="border:none; padding:8px;">
          Place: ${safeGet(pdfData, 'valuationPlace', 'NA')}
        </td>
       
      </tr>

      </table>
      </div>
  </div>

      <!-- ANNEXURE-XIV: FORMAT OF VALUATION REPORT -->
      <div style="padding: 0 12mm; margin-top: 0px; page-break-before: always;">
      <div style="text-align: center; margin-bottom: 5px;">
      <p style="margin: 0; font-weight: bold; font-size: 12pt;">ANNEXURE-XIV</p>
      <p style="margin: 0; font-weight: bold; font-size: 12pt;">FORMAT OF VALUATION REPORT</p>
      <p style="margin: 0; font-weight: bold; font-size: 11pt; padding: 4px;">(to be used for all properties of value upto Rs.5 Crore)</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; margin-top: 15px; font-size: 12pt;">
      <tr>
        <td style="border: 1px solid #000; padding: 8px; width: 50%; font-weight: bold;">Name & Address of Branch</td>
        <td style="border: 1px solid #000; padding: 8px; width: 50%; font-weight: bold;">Name of Customer (s)/ Borrower:<br/><em>(for which valuation report is sought)</em></td>
      </tr>
      <tr>
        <td style="border: 1px solid #000; padding: 8px; width: 50%;">
          To,<br/>The Chief Manager,<br/>State Bank of India,<br/>Specialized Commercial Branch, Ahmedabad,<br/>Gujarat.
        </td>
        <td style="border: 1px solid #000; padding: 8px; width: 50%;">
          <p style="margin: 0; margin-bottom: 8px;"><strong>Borrower Name:</strong> <span>${safeGet(pdfData, 'accountName', safeGet(pdfData, 'borrowerAccountName', 'NA'))}</span></p>
          <p style="margin: 0;"><strong>Owner Name</strong> <span>${safeGet(pdfData, 'nameOfOwnerOrOwners', safeGet(pdfData, 'ownerNameAddress', 'NA'))}</span></p>
        </td>
      </tr>
      </table>

      <div style="margin-top: 5px;">
      <p style="margin: 5px 0; font-weight: bold; font-style: italic;">1. Customer Details:</p>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center; font-weight: bold;">Name of the Property Owner</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center;">${safeGet(pdfData, 'nameOfOwnerOrOwners', safeGet(pdfData, 'ownerNameAddress', 'NA'))}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center; font-weight: bold;">Contact Number of Representative</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center;">${safeGet(pdfData, 'contactNumberOfRepresentative', safeGet(pdfData, 'mobileNumber', 'NA'))}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center; font-weight: bold;">Date of Inspection of Property</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center;">${formatDate(safeGet(pdfData, 'dateOfInspectionOfProperty', safeGet(pdfData, 'inspectionDate', safeGet(pdfData, 'dateOfInspection', 'NA'))))}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center; font-weight: bold;">Date of Valuation Report</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center;">${formatDate(safeGet(pdfData, 'dateOfValuationReport', safeGet(pdfData, 'valuationMadeDate', safeGet(pdfData, 'dateOfValuation', 'NA'))))}</td>
        </tr>
      </table>
      </div>

      <div style="margin-top: 5px;">
      <p style="margin: 5px 0; font-weight: bold; font-style: italic;">2. Property Details</p>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center; font-weight: bold;">Address</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center;">${safeGet(pdfData, 'postalAddress')}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center; font-weight: bold;">Nearby Landmark/Google Map<br/>Independent access to the property</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center;">${safeGet(pdfData, 'latitudeLongitude', safeGet(pdfData, 'nearbyLandmarkGoogleMap', 'NA'))}</td>
          </tr>
      </table>
      </div>

      <div style="margin-top: 5px;">
      <p style="margin: 5px 0; font-weight: bold; font-style: italic;">3. Document Details</p>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;">i.</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center; font-weight: bold;">Sale Deed</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center;">${safeGet(pdfData, 'saleDeed', 'NA')}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;">ii.</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center; font-weight: bold;">GRUDA Impact Plan</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center;">${safeGet(pdfData, 'grudaImpactPlan', 'NA')}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;">iii.</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center; font-weight: bold;">Layout Plan</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center;">${safeGet(pdfData, 'layoutPlan', 'NA')}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;">iv.</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center; font-weight: bold;">Construction Permission</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center;">${safeGet(pdfData, 'constructionPermission', 'NA')}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;">v.</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center; font-weight: bold;">Light Bill</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center;">${safeGet(pdfData, 'lightBill', 'NA')}</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;">vi.</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center; font-weight: bold;">TAX Bill</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; text-align: center;">${safeGet(pdfData, 'taxBill', 'NA')}</td>
        </tr>
      </table>
      </div>

      <div style="margin-top: 5px;">
      <p style="margin: 5px 0; font-weight: bold; font-style: italic;">4. Physical Details</p>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
        <tr>
          <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold;">Adjoining Properties</td>
        </tr>
      </table>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; text-align: center;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%; text-align: center; font-weight: bold;">As per Document</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%; text-align: center; font-weight: bold;">As per Site</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">North</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesNorthDocument', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesNorthSite', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">South</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesSouthDocument', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesSouthSite', 'NA')}</td>
        </tr>
      
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%; font-weight: bold;">As per Document</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%; font-weight: bold;">As per Site</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">East</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesEastDocument', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesEastSite', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">West</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesWestDocument', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'adjoiningPropertiesWestSite', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">Matching of Boundaries</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'matchingOfBoundaries', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'boundariesOfPropertyProperDemarcation', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">Approved land use</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'approvedLandUse', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">Type of Property: ${safeGet(pdfData, 'typeOfProperty', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">No. of Rooms</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">Living/Dining: ${safeGet(pdfData, 'noOfRoomsLivingDining', 'NA')}<br/>Toilet/Bath: ${safeGet(pdfData, 'noOfRoomsToiletBath', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">Bed Rooms: ${safeGet(pdfData, 'bedRooms', 'NA')}<br/>Kitchen + Store: ${safeGet(pdfData, 'kitchenStore', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">Total No of Floor</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'totalNoOfFloor', safeGet(pdfData, 'numberOfFloors', 'NA'))}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">Floor located: ${safeGet(pdfData, 'floorOnWhichPropertyIsLocated', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">Age of the Property</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'ageOfPropertyInYears', 'NA')} Years</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">Residual age: ${safeGet(pdfData, 'residualAgeOfPropertyInYears', 'NA')} Years</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 20%; font-weight: bold;">Year of Construction</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">${safeGet(pdfData, 'yearConstruction', safeGet(pdfData, 'yearOfConstruction', 'NA'))}</td>
          <td style="border: 1px solid #000; padding: 8px; width: 37.5%;">Total life: ${safeGet(pdfData, 'totalLifeOfPropertyInYears', 'NA')} Years</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold;">Type of structure: ${safeGet(pdfData, 'structureType', safeGet(pdfData, 'typeOfStructure', 'NA'))}</td>
        </tr>
      </table>
      </div>

      <div style="margin-top: 5px;">
      <p style="margin: 5px 0; font-weight: bold; font-style: italic;">5. Tenure / Occupancy Details</p>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">Status of Tenure</td>
          <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'statusOfTenure', 'Owner Occupied')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">No. of years of Occupancy Since</td>
          <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'noOfYearsOfOccupancySince', '27 Years Approx.')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">Relationship of tenant or owner</td>
          <td style="border: 1px solid #000; padding: 8px; width: 50%;">${safeGet(pdfData, 'relationshipOfTenantOrOwner', 'NA')}</td>
        </tr>
      </table>
      </div>

      <div style="margin-top: 5px;">
      <p style="margin: 5px 0; font-weight: bold; font-style: italic;">6. Stage of Construction (for which valuation report is sought)</p>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">Stage of Construction</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">${safeGet(pdfData, 'stageOfConstruction', 'NA')}</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">If under construction, extent of completion</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">${safeGet(pdfData, 'ifUnderConstructionExtentOfCompletion', 'NA')}</td>
        </tr>
      </table>
      </div>

      <div style="margin-top: 5px;">
      <p style="margin: 5px 0; font-weight: bold; font-style: italic;">7. Violations if any observed</p>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">Nature and extent of violations</td>
          <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">${safeGet(pdfData, 'natureAndExtentOfViolations', 'NA')}</td>
        </tr>
      </table>
      </div>

      <div style="margin-top: 5px;">
        <p style="margin: 5px 0; font-weight: bold; font-style: italic;">8. Area Details of Property (For Land &amp; Building method)</p>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">Land Area</td>
            <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">
              <div style="padding: 4px;"><strong>As per Sale Deed:</strong> ${safeGet(pdfData, 'landAreaPerSaleDeed', 'NA')}</div>
              <div style="padding: 4px;"><strong>As per GRUDA Impact Plan:</strong> ${safeGet(pdfData, 'areaOfLand', 'NA')}</div>
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">Built-up Area</td>
            <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">
              <div style="padding: 4px;"><strong>As per GRUDA:</strong> ${safeGet(pdfData, 'builtUpAreaPerGrudaImpactPlan', 'NA')}</div>
              <div style="padding: 4px;"><strong>BUA:</strong> ${safeGet(pdfData, 'areaOfConstruction', 'NA')}</div>
            </td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
            <td colspan="2" style="border: 1px solid #000; padding: 8px; font-weight: bold;">CA / BUA / SBUA – in sq. ft: ${safeGet(pdfData, 'cabuaSbuaInSqFt', 'NA')}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
            <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">Remarks</td>
            <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">${safeGet(pdfData, 'remarks', 'NA')}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 5px;">
         <p style="margin: 5px 0; font-weight: bold; font-style: italic;">9. Valuation</p>
         <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
           <tr>
             <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
             <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">Guideline Rate obtained from</td>
             <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">
               ${safeGet(pdfData, 'guidelineRateObtainedFrom', 'NA')}<br><br>
               ${safeGet(pdfData, 'guidelineValue', 'NA')}
             </td>
           </tr>
           <tr>
             <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
             <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">Registrar's office/State Govt. Gazette/Income Tax Notification</td>
             <td style="border: 1px solid #000; padding: 8px; width: 47.5%;">${safeGet(pdfData, 'readyReckonerValue', 'NA')}</td>
           </tr>
         </table>
         <p style="margin: 5px 0; font-weight: bold; font-style: italic;">d) Summary of Valuation</p>
         <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
           <tr>
             <td style="border: 1px solid #000; padding: 8px; width: 5%; text-align: center; font-weight: bold;"></td>
             <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">Guideline Value</td>
             <td style="border: 1px solid #000; padding: 8px; width: 47.5%; font-weight: bold;">${formatCurrencyWithWords(safeGet(pdfData, 'guidelineValue', 'NA'))}</td>
           </tr>
         </table>
       </div>

      <div style="margin-top: 5px;">
      <p style="margin: 5px 0; font-weight: bold; text-align: center;">MARKET VALUE OF THE PROPERTY</p>
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
        <tr>
          <td colspan="3" style="border: 1px solid #000; padding: 8px; font-weight: bold;">1. LAND VALUE:</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold; text-align: center;">Sr. No.</td>
          <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">Land Area – SFT</td>
          <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">Land Rate – Including Land Development cost rate per sq.ft</td>
          <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">Value of Land</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">1.</td>
          <td style="border: 1px solid #000; padding: 8px;">As per Plan:<br>${safeGet(pdfData, 'areaOfLand', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'landRate', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px;">${formatCurrencyWithWords(safeGet(pdfData, 'valueOfLand', 'NA'))}</td>
        </tr>
        <tr>
          <td colspan="2" style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: right;">Total Land Value</td>
          <td colspan="2" style="border: 1px solid #000; padding: 8px; font-weight: bold;">${formatCurrencyWithWords(safeGet(pdfData, 'totalLandValue', safeGet(pdfData, 'valueOfLand', 'NA')))}</td>
        </tr>
      </table>
      </div>

      <div style="margin-top: 5px;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
        <tr>
          <td colspan="7" style="border: 1px solid #000; padding: 8px; font-weight: bold;">2. BUILDING VALUE</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold; text-align: center;">Sr. No.</td>
          <td style="border: 1px solid #000; padding: 8px; width: 17%; font-weight: bold;">Particulars of item</td>
          <td style="border: 1px solid #000; padding: 8px; width: 14%; font-weight: bold;">Plinth area (In Sq.Ft.)</td>
          <td style="border: 1px solid #000; padding: 8px; width: 10%; font-weight: bold;">Roof Heighs (Appx.)</td>
          <td style="border: 1px solid #000; padding: 8px; width: 8%; font-weight: bold;">Age of the Building</td>
          <td style="border: 1px solid #000; padding: 8px; width: 24%; font-weight: bold;">Estimated Replacement Depreciated Rate of Construction per sq.ft</td>
          <td style="border: 1px solid #000; padding: 8px; width: 22%; font-weight: bold;">Value of Construction</td>
        </tr>
        <tr>
          <td style="border: 1px solid #000; padding: 8px; text-align: center;">1.</td>
          <td style="border: 1px solid #000; padding: 8px;">As per Plan: Total BUA</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'plinthArea', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'buildingValueRoofHeight', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'buildingValueAge', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px;">${safeGet(pdfData, 'buildingValueEstimatedReplacementRate', 'NA')}</td>
          <td style="border: 1px solid #000; padding: 8px;">${formatCurrencyWithWords(safeGet(pdfData, 'valueOfConstruction', 'NA'))}</td>
        </tr>
        <tr>
          <td colspan="5" style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: right;">Total Building Value</td>
          <td colspan="2" style="border: 1px solid #000; padding: 8px; font-weight: bold;">${formatCurrencyWithWords(safeGet(pdfData, 'totalBuildingValue', safeGet(pdfData, 'valueOfConstruction', 'NA')))}</td>
        </tr>
      </table>
      </div>

      <div style="margin-top: 5px;">
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 60%; text-align: right; font-weight: bold;">Market Value of Property</td>
            <td style="border: 1px solid #000; padding: 8px; width: 40%; font-weight: bold;">${formatCurrencyWithWords(safeGet(pdfData, 'totalMarketValueOfProperty', safeGet(pdfData, 'marketValue', 'NA')))}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 60%; text-align: right; font-weight: bold;">Realizable value Rs. (90% of Fair market value)</td>
            <td style="border: 1px solid #000; padding: 8px; width: 40%; font-weight: bold;">${formatCurrencyWithWords(safeGet(pdfData, 'realisableValue', 'NA'))}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 60%; text-align: right; font-weight: bold;">Distress Value Rs. (80% of Fair market value)</td>
            <td style="border: 1px solid #000; padding: 8px; width: 40%; font-weight: bold;">${formatCurrencyWithWords(safeGet(pdfData, 'distressSaleValue', safeGet(pdfData, 'distressValue', 'NA')))}</td>
          </tr>
          <tr>
            <td style="border: 1px solid #000; padding: 8px; width: 60%; text-align: right; font-weight: bold;">Insurable Value of the Property</td>
            <td style="border: 1px solid #000; padding: 8px; width: 40%; font-weight: bold;">${formatCurrencyWithWords(safeGet(pdfData, 'insurableValueOfProperty', safeGet(pdfData, 'insurableValue', 'NA')))}</td>
          </tr>
        </table>
      </div>

      <div style="margin-top: 5px;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 60%; font-weight: bold;">Jantri Value of the Property</td>
          <td style="border: 1px solid #000; padding: 8px; width: 40%; font-weight: bold;">₹ 000.00 (Rupees in words)</td>
        </tr>
      </table>
      </div>

      <div style="margin-top: 5px;">
      <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
        <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>
          <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">e) i. In case of variation of 20% or more in the valuation proposed by the valuer and the Guideline value provided in the State Govt. notification or Income Tax Gazette Justification on variation has to be given.</td>
          <td style="border: 1px solid #000; padding: 8px; width: 50%;">
            <strong>a.</strong> Guideline value (Jantri rate) of land/property is the value of the land/property as determined by the government, based on it own metrics of facilities and infrastructure growth in that locality. The stamp duty and registration charges for registering a property deal, is based upon this guideline value. The guideline values are revised periodically but then in sync with the market value; Jantri rates are not relevant in current scenario, as they were last updated in April 2011. Actual market rates have more than doubled since then, depending upon area, locality, demand and supply and other various factors.<br><br>
            
            <strong>b.</strong> Being this the situation, it has been observed that sale deeds are executed at lower price of Jantri rates to save registration charges / stamp duty. So these instances does not reflect actual transaction amount / market rate. Moreover now days, in actual market, transactions are done on super built-p area, whereas guideline value (Jantri rate ) is based on carpet area. Both the areas have difference of about 40-50% This also makes difference between two values.<br><br>
            
            <strong>c.</strong> In present system certain value zones are established at macro levels, but within the same value zone the land prices of all the plots cannot be same. There are certain negative / positive factors, which are attached to any parcel of land, like width of the road on which a plot abuts, frontage to depth ratio, adjoining slum or hutments, title of the property, certain religious & sentimental factors, proximity to high tension electricity supply lines, crematorium, socio economic pattern, stage of infrastructure, development etc. whereas guideline rate are prescribes as uniform rates for particular FP/Zone.<br><br>
            
            <strong>d.</strong> Property/land/flat on the main road in any area is priced higher and should be valued higher than that in interiors, whereas guideline rate considered them all with equal perspective.<br><br>
            
            <strong>e.</strong> In real estate market, it has been observed that many type of values present in market like forced sale value, sentimental value, monopoly value etc. so it cannot be generalized, while guideline value (Jantri rate) considered them all with one value per zone.<br><br>
            
            <strong>f.</strong> Moreover two projects of two different builder having different reputation & quality work in same zone may fetch different values. different builders projects in same zone are now considered for valuation purpose.
    
            <strong>g.</strong> Government policies also change the trends/values in real estate market, for example demonetisation, GST etc. the real estate market reacts immediately for these policies for uptrend or downtrend. So this also affects the market rate heavily. While guideline rates remain same.<br><br>
            
            <strong>h.</strong> It may not be possible to have a method to fix guideline (Jantri rate) values without anomalies as each site has different characteristics. But it is always desired to revise guideline value (Jantri rate) at regular intervals (e.g. Six months) or so, as it is the trend observed in other states e.g. Maharashtra (Mumbai) & other states.<br><br>
            
            <strong>i.</strong> Recently in year 2023, Govt. has released Revised GR for Guideline rate calculation, Tharav No. 122023/20/H/1, Dt. 13/04/2023, as per that various revision are mentioned in Land Rate for Residential land, Composite Rate for Office use and Shop Use, and Agricultural Use etc. The GR is attached herewith
          </td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 50%; font-weight: bold;">ii. Details of last two transactions in the locality/area to be provided, if available.</td>
          <td style="border: 1px solid #000; padding: 8px; width: 50%;">Details not found, please considered above facts</td>
          </tr>
          <tr>
              <td style="border: 1px solid #000; padding: 8px; font-weight: bold; font-style: italic;">REMARKS</td>
          </tr>
          </table>
          <p style="margin: 5px 0; font-weight: bold; font-style: italic;">10. Assumptions/Remarks</p>
          <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
          <tr>
          <td style="border: 1px solid #000; padding: 8px; width: 5%; font-weight: bold; text-align: center;">i</td>
          <td style="border: 1px solid #000; padding: 8px; width: 45%; font-weight: bold;">Qualifications in TIR/Mitigation suggested, if any</td>
          <td style="border: 1px solid #000; padding: 8px; width: 50%;">No</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">2</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Property is SARFAESI compliant</td>
          <td style="border: 1px solid #000; padding: 8px;">Yes, Subject to title Clear report of panel advocate of Bank</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">3</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Whether property belongs to social infrastructure like hospital, school, old age home etc.</td>
          <td style="border: 1px solid #000; padding: 8px;">No</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">4</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Whether entire piece of land on which the unit is set up the property is situated has been mortgaged or to be mortgaged.</td>
          <td style="border: 1px solid #000; padding: 8px;">Yes</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">5</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Details of last two transactions in the locality/area to be provided, if available.</td>
          <td style="border: 1px solid #000; padding: 8px;">As widely known, Market records at sub-Registrar office generally at Jantri value market value evidence is difficult to obtain for reasons of unrecorded/unaccounted market value. Thus, it is not possible to cite last two transactions, in the valuation report.</td>
          </tr>
          <tr>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold; text-align: center;">6</td>
          <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Any other aspect which has relevance on the value or marketability of the property</td>
          <td style="border: 1px solid #000; padding: 8px;">No</td>
          </tr>
          </table>
          </div>

          <div style="margin-top: 5px;">
            <p style="margin: 5px 0; font-weight: bold; font-style: italic;">11. Declaration</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">1. <span style=";"><strong>The property was inspected by ${pdfData.inspectedBy || 'Inspector Name'} ${formatDate(pdfData.dateOfInspectionOfProperty || pdfData.inspectionDate) || '03/12/2025'}.</strong></span></td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">2. The undersigned does not have any direct/indirect interest in the above property.</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">3. The information furnished herein is true and correct to the best of our knowledge.</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;">4. I have submitted Valuation report directly to the Bank.</td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 0px;">
            <p style="margin: 5px 0; font-weight: bold; font-style: italic;">12. Name address &amp; signature of valuer</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
              <tr>
                <td style="border: none; padding: 8px; width: 50%;">
                  <span style=";"><strong>Place: ${safeGet(pdfData, 'valuationPlace', 'NA')}</strong></span><br>
                  <span style=";"><strong>Date: ${safeGet(pdfData, 'reportDate') ? formatDate(pdfData.reportDate) : (safeGet(pdfData, 'valuationDate') ? formatDate(pdfData.valuationDate) : 'NA')}</strong></span>
                </td>
                <td style="border: none; padding: 8px; width: 50%; text-align: right;">
                  <strong>${safeGet(pdfData, 'valuersName', 'Valuer Name')}</strong><br>
                  Govt. Approved Valuer
                </td>
              </tr>
            </table>
          </div>

          <div style="margin-top: 5px;">
            <p style="margin: 5px 0; font-weight: bold; font-style: italic;">13. Enclosures</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 12pt;">
              <tr>
               <td style="border: 1px solid #000; padding: 8px; width: 5%;"></td>

                <td style="border: 1px solid #000; padding: 8px; width: 40%; font-weight: bold;">Layout plan sketch of the area in which the property is located with latitude and longitude</td>
                <td style="border: 1px solid #000; padding: 8px; width: 40%;">Attached as under</td>
              </tr>
              <tr>
                              <td style="border: 1px solid #000; padding: 8px;"></td>

                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Building Plan</td>
                <td style="border: 1px solid #000; padding: 8px;">Attached as under</td>
              </tr>
              <tr>
                              <td style="border: 1px solid #000; padding: 8px;"></td>

                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Floor Plan</td>
                <td style="border: 1px solid #000; padding: 8px;">Attached as under</td>
              </tr>
              <tr>
                              <td style="border: 1px solid #000; padding: 8px;"></td>

                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Photograph of the property (including geo- stamping with date) and owner (in case of housing loans, if borrower is available) including a "Selfie" of the Valuer at the site</td>
                <td style="border: 1px solid #000; padding: 8px;">Attached as under</td>
              </tr>
              <tr>
                              <td style="border: 1px solid #000; padding: 8px;"></td>

                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Certified copy of the approved / sanctioned plan wherever applicable from the concerned office</td>
                <td style="border: 1px solid #000; padding: 8px;">Attached as under</td>
              </tr>
              <tr>
                              <td style="border: 1px solid #000; padding: 8px;"></td>

                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Google Map location of the property</td>
                <td style="border: 1px solid #000; padding: 8px;">Attached as under</td>
              </tr>
              <tr>
                              <td style="border: 1px solid #000; padding: 8px;"></td>

                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Price trend of the Property in the locality/city from property search sites viz Magickbricks.com, 99Acres.com, Makan.com etc</td>
                <td style="border: 1px solid #000; padding: 8px;">Attached as under</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 8px;"></td>

                <td style="border: 1px solid #000; padding: 8px; font-weight: bold;">Any other relevant documents/ extracts</td>
                <td style="border: 1px solid #000; padding: 8px;">NA</td>
              </tr>
            </table>
            <div style="margin-top: 20px;">
            <p style="margin: 5px 0; font-size: 12pt; line-height: 1.6;">
              As a result of my appraisal and analysis, it is my considered opinion that the present <span style=";"><strong>Fair Market Value of the above property in the prevailing Condition with aforesaid specifications is ₹ ${safeGet(pdfData, 'fairMarketValue', 'NA')} (${safeGet(pdfData, 'fairMarketValueWords', 'NA')})</strong></span>
            </p>
          </div>
           <div style="margin-top: 10px;">
            <p style="margin: 5px 0; font-size: 12pt; line-height: 1.6;">
              <span style=";"><strong>The Realizable value of the above property ₹ ${safeGet(pdfData, 'realisableValue', 'NA')} (${safeGet(pdfData, 'realisableValueWords', 'NA')})</strong></span>
            </p>
          </div>
          <div style="margin-top: 15px;">
            <p style="margin: 5px 0; font-size: 12pt; line-height: 1.6;">
              <span style=";"><strong>The Distress value ₹ ${safeGet(pdfData, 'distressValue', 'NA')} (${safeGet(pdfData, 'distressValueWords', 'NA')})</strong></span>
            </p>
          </div>
          <div style="margin-top: 15px;">
            <p style="margin: 5px 0; font-size: 12pt; line-height: 1.6;">
              <span style=";"><strong>The Book value of the above property as per Sale Deed (Reg. No. 1473, Dt. 30/03/1998.) is ₹ ${safeGet(pdfData, 'saleDeedValue', 'NA')} (${safeGet(pdfData, 'saleDeedValueWords', 'NA')})</strong></span>
            </p>
          </div>
          <div style="margin-top: 30px;">
              <p style="margin: 5px 0; ;"><strong>Dated :- ${safeGet(pdfData, 'reportDate') ? formatDate(pdfData.reportDate) : (safeGet(pdfData, 'valuationDate') ? formatDate(pdfData.valuationDate) : 'NA')}</strong></p></br>
              <p style="margin: 5px 0; ;"><strong>Place:- ${safeGet(pdfData, 'valuationPlace', 'NA')}</strong></p>
            </div>
            <div style="margin-top: 10px; text-align: right;">
              <p style="margin: 5px 0; font-weight: bold;">GOVT. REGD APPROVED VALUER</p>
            </div>
          </div>
          </div>

            <!-- Inspection Statement -->
            <div style="margin-top: 10px; line-height: 2; clear: both;">
              <p style="font-size: 12pt;">The undersigned has inspected the property detailed in the Valuation Report dated ${safeGet(pdfData, 'reportDate') ? formatDate(pdfData.reportDate) : '____'} on ${safeGet(pdfData, 'valuationDate') ? formatDate(pdfData.valuationDate) : '____'}.</p>
              <p style="font-size: 12pt;">We are satisfied that the fair and reasonable market value of the property is Rs. ${safeGet(pdfData, 'fairMarketValue', '____')} (Rupees only).</p>
              <p style="margin-top: 60px; text-align: right; font-weight: bold;">Signature</p>
              <p style="text-align: center; font-weight: bold;text-align: right;">(Name of the Branch Manager with Official seal)</p>
            </div>
          </div>

        

          <div style="margin-top: 30px;">
            <p style="margin: 5px 0; text-align: center; font-weight: bold; text-decoration: underline;">CHECKLIST OF DOCUMENT</p>
            <table style="width: 100%; border-collapse: collapse; border: 1px solid #000; font-size: 11pt;">
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold; background: #ffffff;">Engagement Letter / Confirmation for Assignment</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Ownership Documents: Sale Deed</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Adv. TCR / LSR</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Allotment Letter</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Kabular Lekh</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Mortgage Deed</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Lease Deed</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Index – 2</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">VF: 7/12 in case of Land</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">NA order</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Approved Plan</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Commencement Letter</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">BU Permission</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Ele. Meter Photo</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Light Bill</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Muni. Tax Bill</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Numbering = Flat / bungalow / Plot No. / Identification on Site</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Boundaries of Property – Proper Demarcation</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Merged Property?</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Premise can be Separated, and Entrance / Dorr is available for the mortgaged property?</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">NA</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Land is Locked?</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Property is rented to Other Party</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">If Rented = Rent Agreement is Provided?</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Site Visit Photos</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Selfie with Owner / Identifier</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Mobile No.</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Data Sheet</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Tentative Rate</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Sale Instance / Local Inquiry / Verbal Survey</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">Yes</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Broker Recording</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
              <tr>
                <td style="border: 1px solid #000; padding: 6px; font-weight: bold;">Past Valuation Rate</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center;">--</td>
                <td style="border: 1px solid #000; padding: 6px; text-align: center; ;">No</td>
              </tr>
            </table>
             <!-- SOP Section -->
    <div style="margin-top: 15px;width: 60% padding: 8px; border: 1px solid #000;">
      <p style="margin: 4px 0; font-weight: bold; font-size: 12pt;">STANDARD OPERATING PROCEDURE (SOP)</p>
      <p style="margin: 4px 0; font-size: 12pt;">1 &nbsp;&nbsp;BANK GUIDELINES FOR VALUER</p>
      <p style="margin: 4px 0; font-size: 12pt;">2 &nbsp;&nbsp;<span>www.donfinworld.io</span></p>
      <p style="margin: 4px 0; font-size: 12pt;">3 &nbsp;&nbsp;Taskval App for Assignment Management</p>
    </div>
          </div>

          <div style="margin-top: 20px; padding: 10px; page-break-before: always;">
            <p style="margin: 5px 0; font-weight: bold;">❖ PREAMBLE</p>
            <p style="margin: 10px 0; line-height: 1.6; text-align: justify; font-size: 11pt;">
              Bank valuers in India rely on Standard Operating Procedures (SOPs) for several good reasons. SOPs help ensure consistency in property valuations by providing a standardised approach. This results in uniformity in the valuation process across different regions and properties, reducing discrepancies and ensuring fair and objective valuations. Moreover, SOPs establish guidelines and best practices that bank valuers must follow to maintain high-quality and accurate valuations. This guarantees that the bank receives reliable valuations, reducing the risk of financial loss due to overvaluation or undervaluation.
            </p>
            <p style="margin: 10px 0; line-height: 1.6; text-align: justify; font-size: 11pt;">
              SOPs also assist valuers in complying with regulatory frameworks and guidelines set by regulatory authorities, such as the Reserve Bank of India (RBI) and the Securities and Exchange Board of India (SEBI). Valuers who adhere to SOPs lessen the risk of non-compliance and associated penalties. Furthermore, by following standardised procedures, valuers can identify and assess potential risks associated with property valuations, such as legal issues, property conditions, market trends, and encumbrances. This enables banks to make informed lending decisions, reducing the risk of default and protecting the interests of the institution and its customers.
            </p>
            <p style="margin: 10px 0; line-height: 1.6; text-align: justify; font-size: 11pt;">
              SOPs establish ethical guidelines and professional standards for bank valuers, promoting integrity, objectivity, and transparency in the valuation process. By adhering to SOPs, valuers demonstrate their commitment to upholding ethical practices, enhancing the credibility of the valuation profession and maintaining public trust. SOPs also serve as a valuable tool for training new bank valuers and providing ongoing professional development opportunities. They act as a reference guide, helping valuers accurately understand the step-by-step process of conducting valuations. SOPs also facilitate knowledge sharing and consistency among valuers, ensuring that the expertise and experience of senior professionals are passed down to newer members of the profession.
            </p>
            <p style="margin: 10px 0; line-height: 1.6; text-align: justify; font-size: 11pt;">
              In summary, SOPs are crucial for bank valuers in India as they promote consistency, maintain quality, ensure regulatory compliance, mitigate risks, uphold professionalism, and support training and development. By following these procedures, bank valuers can provide accurate and reliable property valuations, contributing to a robust banking system.
            </p>

            <p style="margin: 15px 0; font-weight: bold;">❖ <u>Standard Operating Procedure (SOP)</u></p>
            
      <ol style="margin: 10px 0; padding-left: 20px; line-height: 1.6; font-size: 11pt; list-style: none;">
    <li style="margin-bottom: 8px;">1. Receive a valuation request from the bank.</li>
    <li style="margin-bottom: 8px;">2. Review the request thoroughly to understand the scope, purpose, and specific requirements of the valuation.</li>
    <li style="margin-bottom: 8px;">3. Conduct a preliminary assessment of the property or asset to determine its feasibility for valuation.</li>
    <li style="margin-bottom: 8px;">4. Gather all relevant data and information about the property or asset, including legal documents, title deeds, surveys, plans, and other necessary documents provided by the bank.</li>
    <li style="margin-bottom: 8px;">5. Conduct an on-site inspection of the property or asset, taking photographs, measurements and noting essential details.</li>
    <li style="margin-bottom: 8px;">6. Collect market data and research comparable properties or assets in the vicinity to establish a benchmark for valuation.</li>
    <li style="margin-bottom: 8px;">7. Analyze the collected data and use appropriate valuation methods, such as the sales comparison approach, income approach, or cost approach, depending on the property or asset's nature.</li>
    <li style="margin-bottom: 8px;">8. Prepare a comprehensive and detailed valuation report that includes all relevant information, assumptions made, methodologies used, and supporting evidence.</li>
    <li style="margin-bottom: 8px;">9. Review the report meticulously for accuracy, completeness, and compliance with applicable valuation standards and guidelines.</li>
    <li style="margin-bottom: 8px;">10. Submit the valuation report to the bank within the agreed-upon timeframe.</li>
    <li style="margin-bottom: 8px;">10. Please note that payment for the valuation report is expected to be made within the bank's given time limit from the date of the report. Simply possessing the report will not fulfill its intended purpose.</li>
    <li style="margin-bottom: 8px;">11. Attend a meeting or provide additional clarification to the bank regarding the valuation report, if needed.</li>
    <li style="margin-bottom: 8px;">12. Address any queries or requests for revision from the bank and make necessary amendments to the valuation report as per their feedback.</li>
    <li style="margin-bottom: 8px;">13. Obtain final approval or acceptance of the valuation report from the bank.</li>
    <li style="margin-bottom: 8px;">14. Maintain records of all valuation reports, documents, and communication related to the valuation process for future reference and compliance purposes.</li>
    <li style="margin-bottom: 8px;">15. Follow up with the bank regarding any outstanding payments or administrative formalities.</li>
  </ol>


            <p style="margin: 15px 0; line-height: 1.6; text-align: justify; font-size: 11pt; font: bold;">
            While the process may differ based on the bank's specific requirements and the property or asset being evaluated, this flowchart is a solid foundation for all Banking Valuers in India to confidently and efficiently conduct valuations.
            </p>

            <p style="margin: 15px 0; font-weight: bold;"><u>Observations, Assumptions and Limiting Conditions</u></p>

          <ul style="margin: 10px 0; padding-left: 10px; line-height: 1.6; font-size: 11pt; list-style: none;">
    <li style="margin-bottom: 8px;">
      • The Indian Real Estate market is currently facing a transparency issue. It is highly fragmented and lacks authentic and reliable data on market transactions. The actual transaction value often differs from the value documented in official transactions. To accurately represent market trends, we conducted a market survey among sellers, brokers, developers, and other market participants. This survey is crucial to determine fair valuation in this subject area. Based on our verbal survey, we have gained insights into the real estate market in the subject area.
    </li>

    <li style="margin-bottom: 8px;">
      • To conduct a proper valuation, we have made the assumption that the property in question possesses a title that is clear and marketable and that it is free from any legal or physical encumbrances, disputes, claims, or other statutory liabilities. Additionally, we have assumed that the property has received the necessary planning approvals and clearances from the local authorities and that it adheres to the local development control regulations.
    </li>

    <li style="margin-bottom: 8px;">
      • Please note that this valuation exercise does not cover legal title and ownership matters. Additionally, we have not obtained any legal advice on the subject property's title and ownership during this valuation. Therefore, we advise the client/bank to seek an appropriate legal opinion before making any decisions based on this report.
    </li>

    <li style="margin-bottom: 8px;">
      • We want to ensure that our valuation is fair and accurate. However, it's important to note that any legal, title, or ownership issues could have a significant impact on the value. If we become aware of any such issues at a later date, we may need to adjust our conclusions accordingly.
    </li>

    <li style="margin-bottom: 8px;">
      • Throughout this exercise, we have utilized information from various sources, including hardcopy, softcopy, email, documents, and verbal communication provided by the client. We have proceeded under the assumption that the information provided is entirely reliable, accurate, and complete. However, if it is discovered that the data we were given is not dependable, precise, or comprehensive, we reserve the right to revise our conclusions at a later time.
    </li>

    <li style="margin-bottom: 8px;">
      • Please note that the estimated market value of this property does not include transaction costs such as stamp duty, registration charges, and brokerage fees related to its sale or purchase.
    </li>

    <li style="margin-bottom: 8px;">
      • When conducting a subject valuation exercise, it is important to consider the market dynamics at the time of the evaluation. However, it is essential to note that any unforeseeable developments in the future may impact the valuation. Therefore, it is crucial to remain vigilant and adaptable in the face of changing circumstances.
    </li>

    <li style="margin-bottom: 8px;">
      • Kindly take note that the physical measurements and areas given are only approximations. The exact age of the property can only be determined based on the information obtained during inspection. Furthermore, the remaining economic lifespan is an estimate determined by our professional judgment.
    </li>
  </br>
  </br>
    <li style="margin-bottom: 8px;">
      • Please note that the valuation stated in this report is only applicable for the specific purposes mentioned herein. It is not intended for any other use and cannot be considered valid for any other purpose. The report should not be shared with any third party without our written permission. We cannot assume any responsibility for any third party who may receive or have access to this report, even if consent has been given.
    </li>

    <li style="margin-bottom: 8px;">
      • Having this report or any copy of it does not grant the privilege of publishing it. None of the contents in this report should be shared with third parties through advertising, public relations, news, or any other communication medium without the written acceptance and authorization of VALUERS.
    </li>

    <li style="margin-bottom: 8px;">
      • To assess the condition and estimate the remaining economic lifespan of the item, we rely on visual observations and a thorough review of maintenance, performance, and service records. It's important to note that we have not conducted any structural design or stability studies, nor have we performed any physical tests to determine the item's structural integrity and strength.
    </li>

    <li style="margin-bottom: 8px;">
      • The report was not accompanied by any soil analysis, geological or technical studies, and there were no investigations conducted on subsurface mineral rights, water, oil, gas, or other usage conditions.
    </li>

    <li style="margin-bottom: 8px;">
      • The asset was inspected, evaluated, and assessed by individuals who have expertise in valuing such assets. However, it's important to note that we do not make any assertions or assume responsibility for its compliance with health, safety, environmental, or other regulatory requirements that may not have been immediately apparent during our team's inspection.
    </li>

    <li style="margin-bottom: 8px;">
      • During the inspection, if the units were not named, we relied on identification by the owner or their representative and documents like the sale deed, light bill, plan, tax bill, the title for ownership, and boundaries of the units. Without any accountability for the title of the units.
    </li>

    <li style="margin-bottom: 8px;">
      • Kindly be informed that the valuation report may require modifications in case unanticipated circumstances arise, which were not considered in the presumptions and restrictions specified in the report.
    </li>

    <li style="margin-bottom: 8px;">
      • Additional observations, assumptions, and any relevant limiting conditions are also disclosed in the corresponding sections of this report and its annexes.
    </li>
  </ul>


            <p style="margin: 15px 0; font-weight: bold;">❖ <u>Our standard terms and conditions of professional engagement govern this report. They are outlined below:</u></p>

          <ol style="margin: 10px 0; padding-left: 10px; line-height: 1.6; font-size: 11pt; list-style: none;">
    <li style="margin-bottom: 8px;">
      1. Valuers will be liable for any issues or concerns related to the Valuation and/or other Services provided. This includes situations where the cause of action is in contract, tort (including negligence), statute, or any other form. However, the total amount of liability will not exceed the professional fees paid to VALUERS for this service.
    </li>

    <li style="margin-bottom: 8px;">
      2. VALUERS and its partners, officers, and executives cannot be held liable for any damages, including consequential, incidental, indirect, punitive, exemplary, or special damages. This includes damages resulting from bad debt, non-performing assets, financial loss, malfunctions, delays, loss of data, interruptions of service, or loss of business or anticipated profits.
    </li>

    <li style="margin-bottom: 8px;">
      3. The Valuation Services, along with the Deliverables submitted by VALUERS, are intended solely for the benefit of the parties involved. VALUERS assumes no liability or responsibility towards any third party who utilizes or gains access to the Valuation or benefits from the Services.
    </li>

    <li style="margin-bottom: 8px;">
      4. VALUERS and / or its Partners, Officers and Executives accept no responsibility for detecting fraud or misrepresentation, whether by management or employees of the Client or third parties. Accordingly, VALUERS will not be liable in any way for, or in connection with, fraud or misrepresentations, whether on the part of the Client, its contractors or agents, or any other third party.
    </li>

    <li style="margin-bottom: 8px;">
      5. If you wish to bring a legal proceeding related to the Services or Agreement, it must be initiated within six (6) months from the date you became aware of or should have known about the facts leading to the alleged liability. Additionally, legal proceedings must be initiated no later than one (1) year from the date of the Deliverable that caused the alleged liability.
    </li>

    <li style="margin-bottom: 8px;">
      6. If you, as the client, have any concerns or complaints about the services provided, please do not hesitate to discuss them with the officials of VALUERS. Any service-related issues concerning this Agreement (or any variations or additions to it) must be brought to the attention of VALUERS in writing within one month from the date when you became aware of or should reasonably been aware of the relevant facts. Such issues must be raised no later than six months from the completion date of the services.
    </li>
  </br>
    <li style="margin-bottom: 8px;">
      7. If there is any disagreement regarding the Valuation or other Services that are provided, both parties must first try to resolve the issue through conciliation with their senior representatives. If a resolution cannot be reached within forty-five (45) days, the dispute will be settled through Arbitration in India, following the guidelines of the Arbitration and Conciliation Act 1996. The venue of the arbitration will be located in Ahmedabad, Gujarat, India. The arbitrator(s)' authority will be subject to the terms of the standard terms of service, which includes the limitation of liability provision. All information regarding the arbitration, including the award, will be kept confidential.
    </li>

    <li style="margin-bottom: 8px;">
      8. By utilizing this report, the user is presumed to have thoroughly read, comprehended, and accepted VALUERS' standard business terms and conditions, as well as the assumptions and limitations outlined in this document.
    </li>

    <li style="margin-bottom: 8px;">
      9. We have valued the right property as per the details submitted to me.
    </li>

    <li style="margin-bottom: 8px;">
      10. Please note that payment for the valuation report is expected to be made within the bank's given time limit from the date of the report. Simply possessing the report will not fulfill its intended purpose.
    </li>
    </ol>

          <div style="margin-top: 30px; padding: 20px; text-align: right; ">
            <p style="margin: 0; font-size: 12pt; font-weight: bold;">Rajesh Ganatra</p>
            <p style="margin: 4px 0; font-size: 10pt;">Chartered Engineer (India), B.E. Civil, PMP (PMI USA)</p>
            <p style="margin: 4px 0; font-size: 10pt;">Fellow Institute Of Valuer (Delhi), M.I.E.,</p>
            <p style="margin: 4px 0; font-size: 10pt;">Approved Valuer By Chief Commissioner Of Incom-Tax(II)</p>
            <p style="margin: 4px 0; font-size: 10pt;">Approved Valuer By IOV (Delhi)</p>
            <p style="margin: 4px 0; font-size: 10pt;">5th floor, Shaivk Complex, behind Ganesh Plaza,</p>
            <p style="margin: 4px 0; font-size: 10pt;">Opp. Sanmukh Complex, Off. C G Road,</p>
            <p style="margin: 4px 0; font-size: 10pt;">Navrangpura, Ahmedabad - 380009</p>
            <p style="margin: 8px 0 4px 0; font-size: 10pt;">Mobile: 09825798600</p>
            <p style="margin: 8px 0 4px 0; font-size: 10pt;"> E-Mail: rajeshganatra2003@gmail.com</p>
          </div>

          </div>
          </div>

        

             <!-- PHOTOGRAPHS OF PROPERTY: Property Images in 4x3 grid layout -->
             ${Array.isArray(pdfData.propertyImages) && pdfData.propertyImages.length > 0 ? `
             <div>
               ${(() => {
                const propertyImgs = pdfData.propertyImages.filter(img => {
                    const imgSrc = typeof img === 'string' ? img : (img.src || img.preview || img.data || img.url || img.secure_url || '');
                    return imgSrc && imgSrc.trim();
                });

                if (propertyImgs.length === 0) return '';

                const imagesPerPage = 12; // 4 columns x 3 rows
                const pages = [];
                for (let i = 0; i < propertyImgs.length; i += imagesPerPage) {
                    pages.push(propertyImgs.slice(i, i + imagesPerPage));
                }

                return pages.map((pageImages, pageIdx) => `
                   <div class="page" style="page-break-before: always; page-break-inside: avoid; break-inside: avoid; padding: 12mm; margin: 0; min-height: 297mm; display: flex; flex-direction: column;">
                     <h2 style="text-align: center; margin: 0 0 10px 0; padding: 0 0 5px 0; font-size: 12pt; font-weight: bold; text-decoration: underline; border-bottom: 1px solid #000;">Photographs of Property</h2>
                     <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 5px; margin: 0; padding: 0; width: 100%; flex: 1; page-break-inside: avoid; break-inside: avoid;">
                       ${pageImages.map((img, imgIdx) => {
                    const imgSrc = typeof img === 'string' ? img : (img.src || img.preview || img.data || img.url || img.secure_url || '');
                    const imgLabel = typeof img === 'string' ? `Image ${pageIdx * imagesPerPage + imgIdx + 1}` : (img.label || img.name || `Image ${pageIdx * imagesPerPage + imgIdx + 1}`);
                    return `
                           <div class="image-container" style="page-break-inside: avoid; break-inside: avoid; margin: 0; padding: 3px; position: relative; overflow: hidden; aspect-ratio: 1; display: flex; align-items: center; justify-content: center; width: 100%; border: 1px solid #333; background: #fff;">
                             <img class="pdf-image" src="${imgSrc || ''}" alt="${imgLabel}" style="width: 100%; height: 100%; object-fit: contain; display: block; margin: 0; padding: 0; border: none;" onerror="this.closest('.image-container').remove();" />
                             <div style="position: absolute; top: 1px; right: 1px; background: rgba(100,150,200,0.85); border-radius: 50%; width: 18px; height: 18px; display: flex; align-items: center; justify-content: center; font-size: 8pt; font-weight: bold; color: #fff;">${pageIdx * imagesPerPage + imgIdx + 1}</div>
                           </div>
                         `;
                }).join('')}
                     </div>
                   </div>
                 `).join('')
            })()}
             </div>
             ` : ''}

             ${Array.isArray(pdfData.locationImages) && pdfData.locationImages.length > 0 ? `
             ${pdfData.locationImages.map((img, idx) => {
                const imgSrc = typeof img === 'string' ? img : img?.url;
                return imgSrc ? `
                 <div class="page images-section location-images-page" style="page-break-before: always; break-before: page; height: 297mm; width: 210mm; padding: 0; margin: 0; display: flex; flex-direction: column; justify-content: center; align-items: center; box-sizing: border-box;">
                     <h2 style="text-align: center; font-size: 16pt; font-weight: bold; margin-bottom: 15px;">LOCATION IMAGE ${idx + 1}</h2>
                     <div style="flex: 1; display: flex; justify-content: center; align-items: center; width: 100%; padding: 20px; box-sizing: border-box;">
                         <img class="pdf-image" src="${imgSrc}" alt="Location Image ${idx + 1}" style="width: 100%; height: 100%; object-fit: contain; max-width: 95%; max-height: 80%;">
                     </div>
                 </div>
                 ` : '';
            }).join('')}
             ` : ''}

             ${pdfData.areaImages && typeof pdfData.areaImages === 'object' && Object.keys(pdfData.areaImages).length > 0 ? `
             <div class="page images-section area-images-page" style="page-break-before: always; break-before: page;">
                 <div style="padding: 20px 12mm; font-size: 12pt;">
                     <h2 style="text-align: center; margin-bottom: 20px; font-weight: bold;">PROPERTY AREA IMAGES</h2>
                     ${Object.entries(pdfData.areaImages).map(([areaName, areaImageList]) => {
                return Array.isArray(areaImageList) && areaImageList.length > 0 ? `
                         <div style="margin-bottom: 25px; page-break-inside: avoid; break-inside: avoid;">
                             <h3 style="font-size: 13pt; font-weight: bold; margin-bottom: 12px; border-bottom: 2px solid #333; padding-bottom: 5px; page-break-after: avoid;">${areaName}</h3>
                             <div class="area-image-grid" style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; page-break-inside: avoid; break-inside: avoid;">
                                 ${areaImageList.map((img, idx) => {
                    const imgSrc = typeof img === 'string' ? img : (img?.url || img?.preview || img?.data || img?.src || '');
                    return imgSrc ? `
                                 <div style="page-break-inside: avoid; break-inside: avoid; border: 1px solid #ccc; padding: 6px; text-align: center;">
                                     <img class="pdf-image" src="${imgSrc}" alt="${areaName} Image ${idx + 1}" style="width: 100%; height: auto; max-height: 240px; object-fit: contain;">
                                     <p style="margin-top: 4px; font-size: 8pt; color: #666;">${areaName} - Image ${idx + 1}</p>
                                  </div>
                                     ` : '';
                }).join('')}
                             </div>
                         </div>
                         ` : '';
            }).join('')}
                  </div>
             </div>
             ` : ''}

             ${Array.isArray(pdfData.documentPreviews) && pdfData.documentPreviews.length > 0 ? `
             <div class="page images-section supporting-docs-page" style="page-break-before: always; break-before: page;">
                 <div style="padding: 20px 12mm; font-size: 12pt;">
                     <h2 style="text-align: center; margin-bottom: 20px; font-weight: bold;">SUPPORTING DOCUMENTS</h2>
                     ${pdfData.documentPreviews.map((img, idx) => {
                const imgSrc = typeof img === 'string' ? img : img?.url;
                return imgSrc ? `
                     <div class="image-container" style="page-break-inside: avoid; text-align: center; margin-bottom: 30px;">
                         <img class="pdf-image" src="${imgSrc}" alt="Supporting Document ${idx + 1}" style="width: 90%; height: auto; max-height: 400px; object-fit: contain;">
                         <p style="margin-top: 10px; font-size: 11pt; font-weight: bold;">Supporting Document ${idx + 1}</p>
                     </div>
                     ` : '';
            }).join('')}
                 </div>
             </div>
             ` : ''}
             </div>
             </div>

             
               </body>
             </html>
             `;
}

export async function generateRecordPDF(record) {
  try {
    console.log('📄 Generating PDF for record:', record?.uniqueId || record?.clientName || 'new');
    return await generateRecordPDFOffline(record);
  } catch (error) {
    console.error('❌ PDF generation error:', error);
    throw error;
  }
}

/**
 * Preview PDF in a new tab
 * Uses client-side generation with blob URL preview
 */
export async function previewValuationPDF(record) {
  try {
    console.log('👁️ Generating PDF preview for:', record?.uniqueId || record?.clientName || 'new');

    // Dynamically import jsPDF and html2canvas
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Generate HTML from the record data
    const htmlContent = generateValuationReportHTML(record);

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '210mm';
    container.style.backgroundColor = '#ffffff';
    container.style.fontSize = '12pt';
    container.style.fontFamily = "'Arial', sans-serif";
    // Add fixed page height style for preview with expandable rows
    const style = document.createElement('style');
    style.textContent = `.page { height: 297mm !important; overflow: hidden !important; display: flex !important; flex-direction: column !important; } table { flex: 1 !important; } tbody { height: 100% !important; }`;
    document.head.appendChild(style);
    document.body.appendChild(container);

    // Convert HTML to canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff',
      allowTaint: true,
      windowHeight: container.scrollHeight,
      windowWidth: 793
    });

    // Remove temporary container
    document.body.removeChild(container);

    // Create PDF from canvas
    const imgData = canvas.toDataURL('image/png');
    const imgWidth = 210;
    const pageHeight = 297;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    const pdf = new jsPDF('p', 'mm', 'A4');
    let heightLeft = imgHeight;
    let position = 0;

    // Add pages to PDF
    while (heightLeft >= 0) {
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;
      position -= pageHeight;
      if (heightLeft > 0) {
        pdf.addPage();
      }
    }

    // Create blob URL and open in new tab
    const blob = pdf.output('blob');
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');

    console.log('✅ PDF preview opened');
    return url;
  } catch (error) {
    console.error('❌ PDF preview error:', error);
    throw error;
  }
}

/**
 * Compress image and convert to base64
 */
const compressImage = async (blob) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const img = new Image();

    img.onload = () => {
      // Scale down image: max 1200px width
      const maxWidth = 1200;
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);

      // Convert to JPEG with 70% quality for compression
      canvas.toBlob(
        (compressedBlob) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result);
          reader.readAsDataURL(compressedBlob);
        },
        'image/jpeg',
        0.7
      );
    };

    img.onerror = () => resolve('');

    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target.result;
    };
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert image URL to base64 data URI with compression
 */
const urlToBase64 = async (url) => {
  if (!url) return '';

  try {
    const response = await fetch(url);
    const blob = await response.blob();

    // Compress image to reduce size
    const compressed = await compressImage(blob);
    return compressed;
  } catch (error) {
    console.warn('Failed to convert image to base64:', url, error);
    return '';
  }
};

/**
 * Convert all image URLs in record to base64
 */
const convertImagesToBase64 = async (record) => {
  if (!record) return record;

  const recordCopy = { ...record };

  // Convert property images
  if (Array.isArray(recordCopy.propertyImages)) {
    recordCopy.propertyImages = await Promise.all(
      recordCopy.propertyImages.map(async (img) => {
        if (!img) return img;
        const url = typeof img === 'string' ? img : img?.url;
        if (!url) return img;

        const base64 = await urlToBase64(url);
        if (typeof img === 'string') {
          return base64 || img;
        }
        return { ...img, url: base64 || url };
      })
    );
  }

  // Convert location images
  if (Array.isArray(recordCopy.locationImages)) {
    recordCopy.locationImages = await Promise.all(
      recordCopy.locationImages.map(async (img) => {
        if (!img) return img;
        const url = typeof img === 'string' ? img : img?.url;
        if (!url) return img;

        const base64 = await urlToBase64(url);
        if (typeof img === 'string') {
          return base64 || img;
        }
        return { ...img, url: base64 || url };
      })
    );
  }

  return recordCopy;
};

/**
 * Client-side PDF generation using jsPDF + html2canvas
 * Works on Vercel without server-side dependencies
 */
export async function generateRecordPDFOffline(record) {
  try {
    console.log('📠 Generating PDF (client-side mode)');
    console.log('📊 Input Record Structure:', {
      recordKeys: Object.keys(record || {}),
      rootFields: {
        uniqueId: record?.uniqueId,
        bankName: record?.bankName,
        clientName: record?.clientName,
        city: record?.city,
        engineerName: record?.engineerName
      },
      pdfDetailsKeys: Object.keys(record?.pdfDetails || {}).slice(0, 20),
      totalPdfDetailsFields: Object.keys(record?.pdfDetails || {}).length,
      criticalFields: {
        postalAddress: record?.pdfDetails?.postalAddress,
        areaClassification: record?.pdfDetails?.areaClassification,
        residentialArea: record?.pdfDetails?.residentialArea,
        commercialArea: record?.pdfDetails?.commercialArea,
        inspectionDate: record?.pdfDetails?.inspectionDate,
        agreementForSale: record?.pdfDetails?.agreementForSale
      },
      documentsProduced: record?.documentsProduced,
      agreementForSale_root: record?.agreementForSale,
      agreementForSale_pdfDetails: record?.pdfDetails?.agreementForSale,
      // CRITICAL: Log images at start
      propertyImages_count: Array.isArray(record?.propertyImages) ? record.propertyImages.length : 0,
      locationImages_count: Array.isArray(record?.locationImages) ? record.locationImages.length : 0,
      documentPreviews_count: Array.isArray(record?.documentPreviews) ? record.documentPreviews.length : 0,
      propertyImages_sample: record?.propertyImages?.slice(0, 1),
      locationImages_sample: record?.locationImages?.slice(0, 1),
      documentPreviews_sample: record?.documentPreviews?.slice(0, 1)
    });

    // Convert images to base64 for PDF embedding
    console.log('🖼️ Converting images to base64...');
    const recordWithBase64Images = await convertImagesToBase64(record);

    // Dynamically import jsPDF and html2canvas to avoid SSR issues
    const { jsPDF } = await import('jspdf');
    const html2canvas = (await import('html2canvas')).default;

    // Generate HTML from the record data with base64 images
    const htmlContent = generateValuationReportHTML(recordWithBase64Images);

    // Create a temporary container
    const container = document.createElement('div');
    container.innerHTML = htmlContent;
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '-9999px';
    container.style.width = '210mm';
    container.style.height = 'auto';
    container.style.backgroundColor = '#ffffff';
    container.style.fontSize = '12pt';
    container.style.fontFamily = "'Arial', sans-serif";
    document.body.appendChild(container);

    // CRITICAL: Wait for images to load, then remove failed ones
    const allImages = container.querySelectorAll('img.pdf-image');
    const imagesToRemove = new Set();

    // First pass: check for images with invalid src attribute
    allImages.forEach(img => {
      const src = img.src || img.getAttribute('data-src');
      const alt = img.getAttribute('alt') || 'unknown';

      // If image has no src or invalid src, mark container for removal
      if (!src || !src.trim() || src === 'undefined' || src === 'null') {
        console.log(`⏭️ Invalid image src: ${alt}`);
        let parentContainer = img.closest('.image-container');
        if (parentContainer) {
          imagesToRemove.add(parentContainer);
          console.log(`⏭️ Marking for removal (invalid src): ${alt}`);
        }
      }
    });

    // Second pass: add error listeners to detect failed load attempts
    await Promise.all(Array.from(allImages).map(img => {
      return new Promise((resolve) => {
        const alt = img.getAttribute('alt') || 'unknown';
        const timeoutId = setTimeout(() => {
          // If image hasn't loaded after 5 seconds, mark for removal
          if (!img.complete || img.naturalHeight === 0) {
            console.log(`⏭️ Image timeout/failed to load: ${alt}`);
            let parentContainer = img.closest('.image-container');
            if (parentContainer) {
              imagesToRemove.add(parentContainer);
              console.log(`⏭️ Marking for removal (timeout): ${alt}`);
            }
          }
          resolve();
        }, 5000);

        img.onload = () => {
          clearTimeout(timeoutId);
          console.log(`✅ Image loaded successfully: ${alt}`);
          resolve();
        };

        img.onerror = () => {
          clearTimeout(timeoutId);
          console.log(`❌ Image failed to load: ${alt}`);
          let parentContainer = img.closest('.image-container');
          if (parentContainer) {
            imagesToRemove.add(parentContainer);
            console.log(`⏭️ Marking for removal (onerror): ${alt}`);
          }
          resolve();
        };

        // If already loaded, resolve immediately
        if (img.complete) {
          clearTimeout(timeoutId);
          if (img.naturalHeight === 0) {
            console.log(`⏭️ Image failed (no height): ${alt}`);
            let parentContainer = img.closest('.image-container');
            if (parentContainer) {
              imagesToRemove.add(parentContainer);
              console.log(`⏭️ Marking for removal (no height): ${alt}`);
            }
          } else {
            console.log(`✅ Image already loaded: ${alt}`);
          }
          resolve();
        }
      });
    }));

    // Remove only failed/invalid image containers
    console.log(`🗑️ Removing ${imagesToRemove.size} failed/invalid image containers`);
    imagesToRemove.forEach(el => {
      const alt = el.querySelector('img')?.getAttribute('alt') || 'unknown';
      console.log(`✂️ Removed container: ${alt}`);
      el.remove();
    });

    console.log('✅ Image validation complete - now extracting images BEFORE rendering...');

    // CRITICAL: Render continuous-wrapper and .page elements separately for proper page breaks
    const continuousWrapper = container.querySelector('.continuous-wrapper');
    const pageElements = Array.from(container.querySelectorAll(':scope > .page'));
    console.log(`📄 Total .page elements found: ${pageElements.length}`);

    // Render continuous wrapper first
    let mainCanvas = null;
    if (continuousWrapper) {
      mainCanvas = await html2canvas(continuousWrapper, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        imageTimeout: 10000,
        windowHeight: continuousWrapper.scrollHeight,
        windowWidth: 793,
        onclone: (clonedDocument) => {
          const clonedImages = clonedDocument.querySelectorAll('img');
          clonedImages.forEach(img => {
            img.crossOrigin = 'anonymous';
            img.loading = 'eager';
            img.style.display = 'block';
            img.style.visibility = 'visible';
          });
        }
      });
      console.log('✅ Continuous wrapper canvas conversion complete');
    }

    // Render each .page separately for proper page breaks
    const pageCanvases = [];
    for (let i = 0; i < pageElements.length; i++) {
      const pageEl = pageElements[i];
      console.log(`📄 Rendering .page element ${i + 1}/${pageElements.length}`);

      // Temporarily remove padding to render from top
      const originalPadding = pageEl.style.padding;
      pageEl.style.padding = '0';
      pageEl.style.margin = '0';

      const pageCanvas = await html2canvas(pageEl, {
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        allowTaint: true,
        imageTimeout: 10000,
        windowHeight: pageEl.scrollHeight,
        windowWidth: 793,
        x: 0,
        y: 0,
        onclone: (clonedDocument) => {
          const clonedPageEl = clonedDocument.querySelector('.page') || clonedDocument;
          clonedPageEl.style.padding = '0';
          clonedPageEl.style.margin = '0';

          const clonedImages = clonedDocument.querySelectorAll('img');
          clonedImages.forEach(img => {
            img.crossOrigin = 'anonymous';
            img.loading = 'eager';
            img.style.display = 'block';
            img.style.visibility = 'visible';
          });
        }
      });

      // Restore original padding
      pageEl.style.padding = originalPadding;

      pageCanvases.push(pageCanvas);
      console.log(`✅ .page ${i + 1} canvas conversion complete`);
    }

    console.log(`✅ Page rendering complete - ${pageCanvases.length} .page elements rendered separately`);

    // Extract images BEFORE removing container
    // This prevents empty/blank image containers from appearing in the PDF
    console.log('⏳ Extracting images and removing containers from HTML...');
    const images = Array.from(container.querySelectorAll('img.pdf-image'));
    const imageData = [];

    // Extract valid images and REMOVE ALL their containers
    for (const img of images) {
      const src = img.src || img.getAttribute('data-src');
      const label = img.getAttribute('alt') || 'Image';

      // Only extract images with valid src
      if (src && (src.startsWith('data:') || src.startsWith('blob:') || src.startsWith('http'))) {
        imageData.push({
          src,
          label,
          type: label.includes('Location') ? 'location' :
            label.includes('Supporting') ? 'supporting' : 'property'
        });
        console.log(`📸 Extracted image: ${label}`);
      } else {
        console.log(`⏭️ Invalid image src, will not add to PDF: ${label}`);
      }

      // CRITICAL FIX: REMOVE the ENTIRE image container from HTML
      // (not just hiding the image) to prevent empty boxes from rendering in PDF
      const parentContainer = img.closest('.image-container');
      if (parentContainer) {
        console.log(`🗑️ Removing image container from HTML: ${label}`);
        parentContainer.remove();
      }
    }

    console.log('✅ Extracted', imageData.length, 'images; removed', images.length, 'containers from HTML');

    // Remove temporary container now that we've extracted images
    document.body.removeChild(container);
    console.log('✅ Container removed from DOM');

    // Create PDF from main canvas with header/footer margins
    // Use JPEG for better compression instead of PNG
    const imgData = mainCanvas.toDataURL('image/jpeg', 0.85);
    const imgWidth = 210;
    const pageHeight = 297;
    const headerHeight = 40;  // 10mm header space
    const footerHeight = 40;  // 10mm footer space
    const usableHeight = pageHeight - headerHeight - footerHeight;
    const imgHeight = (mainCanvas.height * imgWidth) / mainCanvas.width;

    // Function to find safe break point (avoid splitting rows)
    const findSafeBreakPoint = (canvasHeight, startPixel, maxHeightPixels, isFirstPage = false, isLastPage = false) => {
      try {
        // Ensure we're within bounds
        const safeStartPixel = Math.max(0, Math.floor(startPixel));
        const safeHeight = Math.min(maxHeightPixels, canvasHeight - safeStartPixel);

        if (safeHeight <= 0) {
          return maxHeightPixels;
        }

        // Get image data to detect row boundaries
        const ctx = mainCanvas.getContext('2d');
        const width = Math.floor(mainCanvas.width);
        const height = Math.floor(safeHeight);

        const imageData = ctx.getImageData(0, safeStartPixel, width, height);
        const data = imageData.data;

        // Look for horizontal lines (table borders) by scanning for rows of dark pixels
        let lastBlackRowIndex = 0;
        let borderThickness = 0;

        const pixelsPerRow = width * 4; // RGBA = 4 bytes per pixel
        const rowCount = height;
        let inBorder = false;
        const borderRows = [];

        for (let row = 0; row < rowCount; row++) {
          let blackCount = 0;
          const rowStart = row * pixelsPerRow;

          // Count dark pixels in this row
          for (let col = 0; col < width; col++) {
            const idx = rowStart + col * 4;
            const r = data[idx];
            const g = data[idx + 1];
            const b = data[idx + 2];

            // Check if pixel is dark (table border)
            if (r < 150 && g < 150 && b < 150) {
              blackCount++;
            }
          }

          // If >60% of row is dark, it's a border line
          if (blackCount > width * 0.6) {
            if (!inBorder) {
              inBorder = true;
              borderThickness = 1;
              borderRows.push(row);
            } else {
              borderThickness++;
            }
            lastBlackRowIndex = row;
          } else {
            inBorder = false;
          }
        }



        // Return the last safe break point (after the border)
        if (lastBlackRowIndex > 0 && lastBlackRowIndex < rowCount - 5) {
          return lastBlackRowIndex;
        }
      } catch (err) {
        console.warn('Error finding safe break point:', err?.message);
      }

      // Fallback to original height if detection fails
      return maxHeightPixels;
    };

    // Detect Y position of c-valuation-section for forced page break
    const cValuationElement = continuousWrapper?.querySelector('.c-valuation-section');
    let cValuationYPixels = null;
    if (cValuationElement) {
      const rect = cValuationElement.getBoundingClientRect();
      const wrapperRect = continuousWrapper.getBoundingClientRect();
      const relativeY = rect.top - wrapperRect.top;
      cValuationYPixels = relativeY * 1.5; // Apply same scale as canvas
      console.log(`🔍 C. VALUATION DETAILS section found at Y: ${cValuationYPixels}px (canvas coordinates)`);
    }

    const pdf = new jsPDF('p', 'mm', 'A4');
    let pageNumber = 1;
    let heightLeft = imgHeight;
    let yPosition = 0;
    let sourceY = 0;  // Track position in the source canvas
    let cValuationPageBreakHandled = false;  // Track if we've handled the page break
    let pageAdded = false;  // Track if first page is added to prevent empty page
    let currentPageYPosition = headerHeight;  // Track current Y position on page to avoid empty pages

    while (heightLeft > 5) {  // Only continue if there's meaningful content left (>5mm to avoid blank pages)
      // Check if we need to force a page break for C. VALUATION DETAILS section
      if (!cValuationPageBreakHandled && cValuationYPixels !== null) {
        const sourceYPixels = (sourceY / imgHeight) * mainCanvas.height;
        const nextSourceYPixels = sourceYPixels + (Math.min(usableHeight, heightLeft) / imgHeight) * mainCanvas.height;

        // If C. VALUATION section will be on this page, force it to next page instead
        if (sourceYPixels < cValuationYPixels && nextSourceYPixels > cValuationYPixels && pageNumber > 1) {
          console.log(`⚠️ C. VALUATION DETAILS would split, forcing to new page`);
          pdf.addPage();
          pageNumber++;
          cValuationPageBreakHandled = true;
          // Skip remaining content and restart from C. VALUATION section
          sourceY = (cValuationYPixels / mainCanvas.height) * imgHeight;
          heightLeft = imgHeight - sourceY;
          continue;
        } else if (sourceYPixels >= cValuationYPixels && sourceYPixels < cValuationYPixels + 100) {
          // We're at the C. VALUATION section, mark it handled
          cValuationPageBreakHandled = true;
          console.log(`✅ C. VALUATION DETAILS is on new page as expected`);
        }
      }

      // Calculate how much of the image fits on this page
      let imageHeightForThisPage = Math.min(usableHeight, heightLeft);

      // Calculate the crop region from the canvas
      const canvasHeight = mainCanvas.height;
      const canvasWidth = mainCanvas.width;
      const sourceYPixels = (sourceY / imgHeight) * canvasHeight;
      const maxHeightPixels = (imageHeightForThisPage / imgHeight) * canvasHeight;

      // Check if this is first or last page
      const isFirstPage = pageNumber === 1;
      const isLastPage = heightLeft - imageHeightForThisPage <= 0;

      // Apply bold borders BEFORE finding safe break point
      const ctx = mainCanvas.getContext('2d');
      const width = Math.floor(mainCanvas.width);
      const height = Math.floor(maxHeightPixels);

      // Guard against getImageData with 0 height
      if (height <= 0) {
        console.warn('⚠️ Height is 0 or negative, skipping image data operations');
        heightLeft -= imageHeightForThisPage;
        sourceY += imageHeightForThisPage;
        pageNumber++;
        if (heightLeft > 0) {
          pdf.addPage();
        }
        continue;
      }

      const imageData = ctx.getImageData(0, Math.floor(sourceYPixels), width, height);
      const data = imageData.data;
      const pixelsPerRow = width * 4;

      // Calculate table boundaries (table is approximately in center, ~645px wide at 1.5x scale = ~430px at normal view)
      // But we need to find it dynamically from the actual border pixels
      let tableLeftBound = 0;
      let tableRightBound = width;

      // Find table left boundary by looking for first vertical line of dark pixels
      for (let col = 0; col < Math.min(200, width); col++) {
        let darkCount = 0;
        for (let row = 10; row < Math.min(50, height); row++) {
          const idx = (row * pixelsPerRow) + (col * 4);
          if (data[idx] < 150 && data[idx + 1] < 150 && data[idx + 2] < 150) {
            darkCount++;
          }
        }
        if (darkCount > 10) {
          tableLeftBound = col;
          break;
        }
      }

      // Find table right boundary by looking for last vertical line of dark pixels
      for (let col = width - 1; col > tableLeftBound + 100; col--) {
        let darkCount = 0;
        for (let row = 10; row < Math.min(50, height); row++) {
          const idx = (row * pixelsPerRow) + (col * 4);
          if (data[idx] < 150 && data[idx + 1] < 150 && data[idx + 2] < 150) {
            darkCount++;
          }
        }
        if (darkCount > 10) {
          tableRightBound = col;
          break;
        }
      }

      // Find top border (first border row in this section)
      if (!isFirstPage) {
        for (let row = 0; row < Math.min(50, height); row++) {
          let blackCount = 0;
          const rowStart = row * pixelsPerRow;
          // Only count dark pixels within table bounds
          for (let col = tableLeftBound; col < tableRightBound; col++) {
            const idx = rowStart + col * 4;
            if (data[idx] < 150 && data[idx + 1] < 150 && data[idx + 2] < 150) {
              blackCount++;
            }
          }
          const tableWidth = tableRightBound - tableLeftBound;
          if (blackCount > tableWidth * 0.6) {
            // Make top border bold - only within table bounds
            for (let offset = -2; offset <= 2; offset++) {
              const boldRow = row + offset;
              if (boldRow >= 0 && boldRow < height) {
                const boldRowStart = boldRow * pixelsPerRow;
                // Only darken pixels within table bounds
                for (let col = tableLeftBound; col < tableRightBound; col++) {
                  const idx = boldRowStart + col * 4;
                  // Preserve original color, just increase opacity/saturation
                  data[idx] = Math.min(255, data[idx] * 0.5);      // R - darken
                  data[idx + 1] = Math.min(255, data[idx + 1] * 0.5);  // G - darken
                  data[idx + 2] = Math.min(255, data[idx + 2] * 0.5);  // B - darken
                  data[idx + 3] = 255; // A
                }
              }
            }
            break;
          }
        }
      }

      // Find bottom border (last border row in this section)
      if (!isLastPage) {
        for (let row = height - 1; row >= Math.max(0, height - 50); row--) {
          let blackCount = 0;
          const rowStart = row * pixelsPerRow;
          // Only count dark pixels within table bounds
          for (let col = tableLeftBound; col < tableRightBound; col++) {
            const idx = rowStart + col * 4;
            if (data[idx] < 150 && data[idx + 1] < 150 && data[idx + 2] < 150) {
              blackCount++;
            }
          }
          const tableWidth = tableRightBound - tableLeftBound;
          if (blackCount > tableWidth * 0.6) {
            // Make bottom border bold - only within table bounds
            for (let offset = -2; offset <= 2; offset++) {
              const boldRow = row + offset;
              if (boldRow >= 0 && boldRow < height) {
                const boldRowStart = boldRow * pixelsPerRow;
                // Only darken pixels within table bounds
                for (let col = tableLeftBound; col < tableRightBound; col++) {
                  const idx = boldRowStart + col * 4;
                  // Preserve original color, just increase opacity/saturation
                  data[idx] = Math.min(255, data[idx] * 0.5);      // R - darken
                  data[idx + 1] = Math.min(255, data[idx + 1] * 0.5);  // G - darken
                  data[idx + 2] = Math.min(255, data[idx + 2] * 0.5);  // B - darken
                  data[idx + 3] = 255; // A
                }
              }
            }
            break;
          }
        }
      }

      ctx.putImageData(imageData, 0, Math.floor(sourceYPixels));

      // Find safe break point to avoid splitting rows
      const safeHeightPixels = findSafeBreakPoint(canvasHeight, sourceYPixels, maxHeightPixels, isFirstPage, isLastPage);
      const sourceHeightPixels = Math.min(safeHeightPixels, maxHeightPixels);

      // Recalculate the actual height used
      imageHeightForThisPage = (sourceHeightPixels / canvasHeight) * imgHeight;

      // Create a cropped canvas for this page
      const croppedPageCanvas = document.createElement('canvas');
      croppedPageCanvas.width = canvasWidth;
      croppedPageCanvas.height = sourceHeightPixels;
      const pageCtx = croppedPageCanvas.getContext('2d');
      pageCtx.drawImage(
        mainCanvas,
        0, sourceYPixels,
        canvasWidth, sourceHeightPixels,
        0, 0,
        canvasWidth, sourceHeightPixels
      );

      const pageImgData = croppedPageCanvas.toDataURL('image/jpeg', 0.85);

      // Only add content if it has meaningful height (avoid blank pages)
      if (imageHeightForThisPage > 2) {  // Only add if >2mm height
        // Only add new page if not first page - first page already exists from jsPDF init
        if (pageAdded) {
          pdf.addPage();
        } else {
          pageAdded = true;
        }

        // Add image with top margin (header space)
        pdf.addImage(pageImgData, 'JPEG', 0, headerHeight, imgWidth, imageHeightForThisPage);

        // Add page number in footer
        pdf.setFontSize(9);
        pdf.text(`Page ${pageNumber}`, 105, pageHeight - 5, { align: 'center' });

        // Update Y position tracking
        currentPageYPosition = headerHeight + imageHeightForThisPage;

        pageNumber++;
      }

      // Update counters
      heightLeft -= imageHeightForThisPage;
      sourceY += imageHeightForThisPage;
    }

    // Reset currentPageYPosition since we're starting new section for separate .page elements
    currentPageYPosition = headerHeight;

    // Add page canvases as separate pages in PDF
    console.log(`📄 Adding ${pageCanvases.length} separate .page canvases to PDF...`);
    for (let i = 0; i < pageCanvases.length; i++) {
      const pageCanvas = pageCanvases[i];
      const pageImgData = pageCanvas.toDataURL('image/jpeg', 0.85);
      const pageImgHeight = (pageCanvas.height * imgWidth) / pageCanvas.width;

      // Only add new page if there's substantial content on current page (more than just header space)
      // currentPageYPosition > headerHeight + 20 means there's at least 20mm of content
      if (currentPageYPosition > headerHeight + 20) {
        pdf.addPage();
        pageNumber++;
        currentPageYPosition = headerHeight;
        console.log(`📄 Added new page for .page element ${i + 1}`);
      } else {
        console.log(`📄 Skipping new page for .page element ${i + 1} - minimal content on current page`);
        // If on current page with minimal content, just continue on same page
        // currentPageYPosition already at headerHeight, ready for new content
      }

      // Add image with proper margins (12mm = ~45px at 96dpi)
      const leftMargin = 12;
      const topMargin = 12;
      const availableWidth = imgWidth - (leftMargin * 2);
      const adjustedImgHeight = (pageCanvas.height * availableWidth) / pageCanvas.width;

      pdf.addImage(pageImgData, 'JPEG', leftMargin, topMargin, availableWidth, adjustedImgHeight);
      pdf.setFontSize(9);
      pdf.text(`Page ${pageNumber}`, 105, pageHeight - 5, { align: 'center' });
      
      // Update Y position tracking
      currentPageYPosition = topMargin + adjustedImgHeight;

      pageNumber++;
      console.log(`✅ Added .page canvas ${i + 1} as page ${pageNumber - 1}`);
    }

    // Add images as separate pages
    console.log('📸 Adding', imageData.length, 'images to PDF...');

    // Filter out images with invalid src before adding to PDF
    const validImages = imageData.filter(img => {
      if (!img.src || typeof img.src !== 'string' || !img.src.trim()) {
        console.log(`⏭️ Skipping image with invalid src: ${img.label}`);
        return false;
      }
      return true;
    });

    if (validImages.length > 0) {
      // Separate images by type
      const propertyImgs = validImages.filter(img => img.type === 'property');
      const locationImgs = validImages.filter(img => img.type === 'location');
      const supportingImgs = validImages.filter(img => img.type === 'supporting');

      // ===== ADD PROPERTY IMAGES: 6 per page (2 columns x 3 rows) =====
      if (propertyImgs.length > 0) {
        pdf.addPage();
        let imgIndex = 0;

        while (imgIndex < propertyImgs.length) {
          const startIdx = imgIndex;
          let row = 0;

          // Add up to 6 images (2 columns x 3 rows) per page
          for (row = 0; row < 3 && imgIndex < propertyImgs.length; row++) {
            const yPos = 15 + row * 92; // 3 rows with spacing

            // Left column
            if (imgIndex < propertyImgs.length) {
              const img = propertyImgs[imgIndex];
              try {
                if (img.src.startsWith('data:') || img.src.startsWith('blob:') || img.src.startsWith('http://') || img.src.startsWith('https://')) {
                  pdf.setFontSize(8);
                  pdf.setFont(undefined, 'bold');
                  pdf.text(img.label, 12, yPos);
                  pdf.addImage(img.src, 'JPEG', 12, yPos + 4, 92, 82);
                  console.log(`✅ Added property image (L): ${img.label}`);
                }
              } catch (err) {
                console.warn(`Failed to add property image ${img.label}:`, err?.message);
              }
              imgIndex++;
            }

            // Right column
            if (imgIndex < propertyImgs.length) {
              const img = propertyImgs[imgIndex];
              try {
                if (img.src.startsWith('data:') || img.src.startsWith('blob:') || img.src.startsWith('http://') || img.src.startsWith('https://')) {
                  pdf.setFontSize(8);
                  pdf.setFont(undefined, 'bold');
                  pdf.text(img.label, 108, yPos);
                  pdf.addImage(img.src, 'JPEG', 108, yPos + 4, 92, 82);
                  console.log(`✅ Added property image (R): ${img.label}`);
                }
              } catch (err) {
                console.warn(`Failed to add property image ${img.label}:`, err?.message);
              }
              imgIndex++;
            }
          }

          // Add new page if more images remain
          if (imgIndex < propertyImgs.length) {
            pdf.addPage();
          }
        }
      }

      // ===== ADD LOCATION IMAGES: 1 per page =====
      if (locationImgs.length > 0) {
        for (let i = 0; i < locationImgs.length; i++) {
          const img = locationImgs[i];

          try {
            if (!img.src.startsWith('data:') && !img.src.startsWith('blob:') && !img.src.startsWith('http://') && !img.src.startsWith('https://')) {
              continue;
            }

            pdf.addPage();

            // Add image title
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.text(img.label, 15, 15);

            // Add image - 1 per page, larger size
            const imgWidth = 180;
            const imgHeight = 220;
            pdf.addImage(img.src, 'JPEG', 15, 25, imgWidth, imgHeight);

            console.log(`✅ Added location image: ${img.label}`);
          } catch (err) {
            console.warn(`Failed to add location image ${img.label}:`, err?.message);
          }
        }
      }

      // ===== ADD SUPPORTING DOCUMENTS: 1 per page =====
      if (supportingImgs.length > 0) {
        for (let i = 0; i < supportingImgs.length; i++) {
          const img = supportingImgs[i];

          try {
            if (!img.src.startsWith('data:') && !img.src.startsWith('blob:') && !img.src.startsWith('http://') && !img.src.startsWith('https://')) {
              continue;
            }

            pdf.addPage();

            // Add image title
            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.text(img.label, 15, 15);

            // Add image - 1 per page, larger size
            const imgWidth = 180;
            const imgHeight = 220;
            pdf.addImage(img.src, 'JPEG', 15, 25, imgWidth, imgHeight);

            console.log(`✅ Added supporting document: ${img.label}`);
          } catch (err) {
            console.warn(`Failed to add supporting document ${img.label}:`, err?.message);
          }
        }
      }
    } else {
      console.log('⏭️ No valid images to add to PDF');
    }

    // Download PDF
    const filename = `valuation_${record?.clientName || record?.uniqueId || Date.now()}.pdf`;
    pdf.save(filename);

    console.log('✅ PDF generated and downloaded:', filename);
    return filename;
  } catch (error) {
    console.error('❌ Client-side PDF generation error:', error);
    throw error;
  }
}

// Alias for generateRecordPDF to match import name
export const generateRowHouse = generateRecordPDF;

const pdfExportService = {
    generateValuationReportHTML,
    generateRecordPDF,
    generateRowHouse,
    previewValuationPDF,
    generateRecordPDFOffline,
    normalizeDataForPDF
};

export default pdfExportService;