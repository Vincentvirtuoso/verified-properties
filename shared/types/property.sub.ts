export type PropertyDocumentType =
  | "certificateOfOccupancy"
  | "governorsConsent"
  | "deedOfAssignment"
  | "deedOfSublease"
  | "deedOfSurrender"
  | "deedOfMortgage"
  | "deedOfGift"
  | "deedOfLease"
  | "deedOfConveyance"
  | "surveyPlan"
  | "approvedBuildingPlan"
  | "excisionDocument"
  | "gazette"
  | "letterOfAllocation"
  | "receiptOfPaymentForLand"
  | "contractOfSale"
  | "powerOfAttorney"
  | "irrevocablePowerOfAttorney"
  | "affidavitOfLoss"
  | "probateLetterOfAdministration"
  | "landPurchaseAgreement"
  | "taxClearanceCertificate"
  | "certificateOfStatutoryRightOfOccupancy"
  | "registeredSurveyPlan";

export type PropertyCategory =
  | "residential"
  | "commercial"
  | "industrial"
  | "agricultural"
  | "land"
  | "mixedUse"
  | "hospitality"
  | "institutional";

export type PropertyType =
  | "singleFamilyHouse"
  | "detachedHouse"
  | "semiDetachedHouse"
  | "terraceHouse"
  | "bungalow"
  | "mansion"
  | "apartment"
  | "selfContainedApartment"
  | "servicedApartment"
  | "guestRoom"
  | "guestHouse"
  | "studentHostel"
  | "duplex"
  | "detachedDuplex"
  | "semiDetachedDuplex"
  | "terraceDuplex"
  | "duplexWithBQ"
  | "duplexWithPenthouse"
  | "duplexVilla"
  | "duplexMaisonette"
  | "gardenDuplex"
  | "smartDuplex"
  | "maisonette"
  | "penthouse"
  | "officeSpace"
  | "retailShop"
  | "warehouse"
  | "hotel"
  | "factory"
  | "industrialPark"
  | "coldStorage"
  | "residentialLand"
  | "commercialLand"
  | "agriculturalLand"
  | "mixedUseLand"
  | "farm"
  | "farmhouse"
  | "mixedUseDevelopment"
  | "resortAndEventCenter"
  | "schoolOrHospital";

export type PropertyFeature =
  | "propertyType"
  | "numberOfBedrooms"
  | "numberOfBathrooms"
  | "numberOfToilets"
  | "numberOfLivingRooms"
  | "numberOfFloorsStoreys"
  | "builtUpAreaSqm"
  | "landSizeSqmOrHectares"
  | "yearOfConstruction"
  | "propertyCondition"
  | "architecturalStyle"
  | "furnishingStatus"
  | "propertyOrientation"
  | "floorLevel"
  | "numberOfGuestRooms"
  | "fittedKitchen"
  | "walkInCloset"
  | "builtInWardrobes"
  | "enSuiteBedrooms"
  | "diningArea"
  | "studyRoomHomeOffice"
  | "pantryStoreRoom"
  | "laundryRoom"
  | "balcony"
  | "terrace"
  | "walkInShower"
  | "bathtub"
  | "guestToilet"
  | "familyLounge"
  | "privateEntrance"
  | "walkInPantry"
  | "staffAccommodation"
  | "liftElevatorAccess"
  | "receptionLobby"
  | "receptionArea"
  | "highCeilings"
  | "largeWindows"
  | "premiumFlooring"
  | "popCeiling"
  | "modernInteriorFinishing"
  | "airConditioning"
  | "waterHeater"
  | "fullyFurnished"
  | "wifi"
  | "smartTv"
  | "kitchenAppliances"
  | "washingMachine"
  | "refrigerator"
  | "microwave"
  | "electricKettle"
  | "ironAndIroningBoard"
  | "commercialKitchen"
  | "storageArea"
  | "storageRacks"
  | "coldStorage"
  | "refrigerationFacilities"
  | "laundryService"
  | "sharedLaundryFacility"
  | "laundryDepartment"
  | "housekeeping"
  | "garden"
  | "privateCourtyard"
  | "rooftop"
  | "outdoorKitchen"
  | "boysQuarters"
  | "servantsQuarters"
  | "selfContainedGuestHouse"
  | "swimmingPool"
  | "outdoorSeatingArea"
  | "driveway"
  | "pavedCompound"
  | "landscapedGardens"
  | "rooftopLounge"
  | "barbecueArea"
  | "picnicArea"
  | "privateGarden"
  | "privateSwimmingPool"
  | "sharedBalcony"
  | "sharedSwimmingPool"
  | "sharedGarden"
  | "fencing"
  | "farmAccessRoad"
  | "dedicatedParkingSpaces"
  | "coveredCarport"
  | "garage"
  | "visitorsParking"
  | "sharedParking"
  | "dedicatedCommercialParking"
  | "guestParking"
  | "electricVehicleChargingStation"
  | "shuttleOrTransportService"
  | "airportPickupService"
  | "truckAccess"
  | "loadingBay"
  | "loadingDocks"
  | "goodsLift"
  | "solarPanelInstallation"
  | "prepaidElectricityMeter"
  | "dedicatedElectricityMeter"
  | "backupGeneratorConnection"
  | "solarPowerSystem"
  | "inverterSystem"
  | "borehole"
  | "waterStorageTank"
  | "centralWaterSupply"
  | "sewageSystem"
  | "septicTank"
  | "fibreInternetReadiness"
  | "drainageSystem"
  | "drainageAvailability"
  | "twentyFourHourElectricity"
  | "backupGenerator"
  | "solarBackupPower"
  | "reliableWaterSupply"
  | "boreholeWater"
  | "highSpeedInternet"
  | "wasteCollection"
  | "sewageManagement"
  | "streetLighting"
  | "maintenanceServices"
  | "facilityManagement"
  | "elevatorLift"
  | "centralWasteDisposal"
  | "backupPowerForCommonAreas"
  | "threePhaseElectricity"
  | "heavyDutyPowerSupply"
  | "generatorHouse"
  | "generatorInstallation"
  | "industrialVentilation"
  | "industrialWasteManagement"
  | "electricitySupply"
  | "waterSource"
  | "irrigationSystem"
  | "riverOrStreamAccess"
  | "fullyFencedCompound"
  | "gatedEntrance"
  | "perimeterFencing"
  | "automatedGate"
  | "cctvInstallation"
  | "intercomSystem"
  | "fireAlarmSystem"
  | "smokeDetectors"
  | "lightningProtection"
  | "twentyFourHourSecurity"
  | "securityGuards"
  | "gatedEstate"
  | "controlledAccess"
  | "smartAccessControl"
  | "securityAlarm"
  | "electricFence"
  | "securityPatrol"
  | "fireSafetyEquipment"
  | "emergencyExits"
  | "visitorRegistrationSystem"
  | "securityService"
  | "fireSuppressionSystem"
  | "sprinklerSystem"
  | "securityControlRoom"
  | "fireSafetySystem"
  | "multipleEntrances"
  | "gymFitnessCentre"
  | "childrensPlayground"
  | "clubhouse"
  | "sportsCourt"
  | "tennisCourt"
  | "basketballCourt"
  | "joggingTrack"
  | "spaAndSauna"
  | "gamesRoom"
  | "residentsLounge"
  | "supermarketConvenienceStore"
  | "restaurantOrCafe"
  | "pharmacy"
  | "schoolOrDaycare"
  | "medicalCentre"
  | "atmOrBankingServices"
  | "estateManagementOffice"
  | "communityHall"
  | "placesOfWorship"
  | "coWorkingSpace"
  | "parcelDeliveryRoom"
  | "conciergeService"
  | "serviceCharge"
  | "bar"
  | "conferenceFacilities"
  | "banquetHall"
  | "roomService"
  | "spaFacilities"
  | "eventSpace"
  | "businessCentre"
  | "cleaningService"
  | "receptionDesk"
  | "twentyFourHourCheckIn"
  | "selfCheckIn"
  | "freshBedLinen"
  | "towelsProvided"
  | "toiletriesProvided"
  | "sharedGym"
  | "certificateOfOccupancy"
  | "governorsConsent"
  | "registeredDeed"
  | "allocationLetter"
  | "surveyPlanAvailable"
  | "deedOfAssignmentAvailable"
  | "gazetteStatus"
  | "excisionStatus"
  | "landUseZoning"
  | "residentialLandUse"
  | "commercialLandUse"
  | "industrialLandUse"
  | "agriculturalLandUse"
  | "mixedUseLandUse"
  | "plotDimensions"
  | "dryLand"
  | "swampyTerrain"
  | "flatTerrain"
  | "slopingTerrain"
  | "fencedLand"
  | "unfencedLand"
  | "roadAccess"
  | "electricityAvailability"
  | "waterAvailability"
  | "developedArea"
  | "undevelopedArea"
  | "estateLayoutApproval"
  | "buildingApprovalStatus"
  | "governmentAcquisitionStatus"
  | "officeSuites"
  | "conferenceRoom"
  | "meetingRooms"
  | "openPlanOffice"
  | "privateOffices"
  | "retailShopFrontage"
  | "displayWindows"
  | "warehouseSpace"
  | "highCeilingHeight"
  | "heavyDutyFlooring"
  | "customerWaitingArea"
  | "warehouseFloorArea"
  | "ceilingClearHeight"
  | "industrialFlooring"
  | "staffOffices"
  | "staffToilets"
  | "staffChangingRooms"
  | "totalFarmArea"
  | "soilType"
  | "soilFertility"
  | "farmhouse"
  | "storageBarn"
  | "farmWarehouse"
  | "livestockPen"
  | "poultryHouse"
  | "fishPond"
  | "greenhouse"
  | "farmEquipmentStorage"
  | "processingFacility"
  | "proximityToMarkets"
  | "wheelchairAccess"
  | "accessibleRamps"
  | "wheelchairFriendlyEntrance"
  | "accessibleBathroom"
  | "handrails"
  | "stepFreeAccess"
  | "wideDoorways"
  | "smartHome"
  | "smartDoorLock"
  | "smartLighting"
  | "smartThermostat"
  | "smartSecuritySystem"
  | "videoDoorbell"
  | "remoteGateControl"
  | "motionSensors"
  | "automatedLighting"
  | "energyMonitoringSystem"
  | "smartWaterManagement"
  | "furnished"
  | "serviced";

export const featureLabels: Record<PropertyFeature, string> = {
  propertyType: "Property Type",
  numberOfBedrooms: "Number of Bedrooms",
  numberOfBathrooms: "Number of Bathrooms",
  numberOfToilets: "Number of Toilets",
  numberOfLivingRooms: "Number of Living Rooms",
  numberOfFloorsStoreys: "Number of Floors/Storeys",
  builtUpAreaSqm: "Built-up Area (sqm)",
  landSizeSqmOrHectares: "Land Size (sqm or hectares)",
  yearOfConstruction: "Year of Construction",
  propertyCondition: "Property Condition",
  architecturalStyle: "Architectural Style",
  furnishingStatus: "Furnishing Status",
  propertyOrientation: "Property Orientation",
  floorLevel: "Floor Level",
  numberOfGuestRooms: "Number of Guest Rooms",

  fittedKitchen: "Fitted Kitchen",
  walkInCloset: "Walk-in Closet",
  builtInWardrobes: "Built-in Wardrobes",
  enSuiteBedrooms: "En-suite Bedrooms",
  diningArea: "Dining Area",
  studyRoomHomeOffice: "Study Room/Home Office",
  pantryStoreRoom: "Pantry/Store Room",
  laundryRoom: "Laundry Room",
  balcony: "Balcony",
  terrace: "Terrace",
  walkInShower: "Walk-in Shower",
  bathtub: "Bathtub",
  guestToilet: "Guest Toilet",
  familyLounge: "Family Lounge",
  privateEntrance: "Private Entrance",
  walkInPantry: "Walk-in Pantry",
  staffAccommodation: "Staff Accommodation",
  liftElevatorAccess: "Lift/Elevator Access",
  receptionLobby: "Reception/Lobby",
  receptionArea: "Reception Area",

  highCeilings: "High Ceilings",
  largeWindows: "Large Windows",
  premiumFlooring: "Premium Flooring",
  popCeiling: "POP Ceiling",
  modernInteriorFinishing: "Modern Interior Finishing",
  airConditioning: "Air Conditioning",
  waterHeater: "Water Heater",
  fullyFurnished: "Fully Furnished",
  wifi: "Wi-Fi",
  smartTv: "Smart TV",
  kitchenAppliances: "Kitchen Appliances",
  washingMachine: "Washing Machine",
  refrigerator: "Refrigerator",
  microwave: "Microwave",
  electricKettle: "Electric Kettle",
  ironAndIroningBoard: "Iron and Ironing Board",

  commercialKitchen: "Commercial Kitchen",
  storageArea: "Storage Area",
  storageRacks: "Storage Racks",
  coldStorage: "Cold Storage",
  refrigerationFacilities: "Refrigeration Facilities",
  laundryService: "Laundry Service",
  sharedLaundryFacility: "Shared Laundry Facility",
  laundryDepartment: "Laundry Department",
  housekeeping: "Housekeeping",

  garden: "Garden",
  privateCourtyard: "Private Courtyard",
  rooftop: "Rooftop",
  outdoorKitchen: "Outdoor Kitchen",
  boysQuarters: "Boys' Quarters (BQ)",
  servantsQuarters: "Servants' Quarters",
  selfContainedGuestHouse: "Self-contained Guest House",
  swimmingPool: "Swimming Pool",
  outdoorSeatingArea: "Outdoor Seating Area",
  driveway: "Driveway",
  pavedCompound: "Paved Compound",
  landscapedGardens: "Landscaped Gardens",
  rooftopLounge: "Rooftop Lounge",
  barbecueArea: "Barbecue Area",
  picnicArea: "Picnic Area",
  privateGarden: "Private Garden",
  privateSwimmingPool: "Private Swimming Pool",
  sharedBalcony: "Shared Balcony",
  sharedSwimmingPool: "Shared Swimming Pool",
  sharedGarden: "Shared Garden",
  fencing: "Fencing",
  farmAccessRoad: "Farm Access Road",

  dedicatedParkingSpaces: "Dedicated Parking Spaces",
  coveredCarport: "Covered Carport",
  garage: "Garage",
  visitorsParking: "Visitors' Parking",
  sharedParking: "Shared Parking",
  dedicatedCommercialParking: "Dedicated Commercial Parking",
  guestParking: "Guest Parking",
  electricVehicleChargingStation: "Electric Vehicle Charging Station",
  shuttleOrTransportService: "Shuttle or Transport Service",
  airportPickupService: "Airport Pickup Service",
  truckAccess: "Truck Access",
  loadingBay: "Loading Bay",
  loadingDocks: "Loading Docks",
  goodsLift: "Goods Lift",

  solarPanelInstallation: "Solar Panel Installation",
  prepaidElectricityMeter: "Prepaid Electricity Meter",
  dedicatedElectricityMeter: "Dedicated Electricity Meter",
  backupGeneratorConnection: "Backup Generator Connection",
  solarPowerSystem: "Solar Power System",
  inverterSystem: "Inverter System",
  borehole: "Borehole",
  waterStorageTank: "Water Storage Tank",
  centralWaterSupply: "Central Water Supply",
  sewageSystem: "Sewage System",
  septicTank: "Septic Tank",
  fibreInternetReadiness: "Fibre Internet Readiness",
  drainageSystem: "Drainage System",
  drainageAvailability: "Drainage Availability",
  twentyFourHourElectricity: "24-hour Electricity",
  backupGenerator: "Backup Generator",
  solarBackupPower: "Solar Backup Power",
  reliableWaterSupply: "Reliable Water Supply",
  boreholeWater: "Borehole Water",
  highSpeedInternet: "High-speed Internet",
  wasteCollection: "Waste Collection",
  sewageManagement: "Sewage Management",
  streetLighting: "Street Lighting",
  maintenanceServices: "Maintenance Services",
  facilityManagement: "Facility Management",
  elevatorLift: "Elevator/Lift",
  centralWasteDisposal: "Central Waste Disposal",
  backupPowerForCommonAreas: "Backup Power for Common Areas",
  threePhaseElectricity: "Three-phase Electricity",
  heavyDutyPowerSupply: "Heavy-duty Power Supply",
  generatorHouse: "Generator House",
  generatorInstallation: "Generator Installation",
  industrialVentilation: "Industrial Ventilation",
  industrialWasteManagement: "Industrial Waste Management",
  electricitySupply: "Electricity Supply",
  waterSource: "Water Source",
  irrigationSystem: "Irrigation System",
  riverOrStreamAccess: "River or Stream Access",

  fullyFencedCompound: "Fully Fenced Compound",
  gatedEntrance: "Gated Entrance",
  perimeterFencing: "Perimeter Fencing",
  automatedGate: "Automated Gate",
  cctvInstallation: "CCTV Installation",
  intercomSystem: "Intercom System",
  fireAlarmSystem: "Fire Alarm System",
  smokeDetectors: "Smoke Detectors",
  lightningProtection: "Lightning Protection",
  twentyFourHourSecurity: "24-hour Security",
  securityGuards: "Security Guards",
  gatedEstate: "Gated Estate",
  controlledAccess: "Controlled Access",
  smartAccessControl: "Smart Access Control",
  securityAlarm: "Security Alarm",
  electricFence: "Electric Fence",
  securityPatrol: "Security Patrol",
  fireSafetyEquipment: "Fire Safety Equipment",
  emergencyExits: "Emergency Exits",
  visitorRegistrationSystem: "Visitor Registration System",
  securityService: "Security Service",
  fireSuppressionSystem: "Fire Suppression System",
  sprinklerSystem: "Sprinkler System",
  securityControlRoom: "Security Control Room",
  fireSafetySystem: "Fire Safety System",
  multipleEntrances: "Multiple Entrances",

  gymFitnessCentre: "Gym/Fitness Centre",
  childrensPlayground: "Children's Playground",
  clubhouse: "Clubhouse",
  sportsCourt: "Sports Court",
  tennisCourt: "Tennis Court",
  basketballCourt: "Basketball Court",
  joggingTrack: "Jogging Track",
  spaAndSauna: "Spa and Sauna",
  gamesRoom: "Games Room",
  residentsLounge: "Residents' Lounge",
  supermarketConvenienceStore: "Supermarket/Convenience Store",
  restaurantOrCafe: "Restaurant or Café",
  pharmacy: "Pharmacy",
  schoolOrDaycare: "School or Daycare",
  medicalCentre: "Medical Centre",
  atmOrBankingServices: "ATM or Banking Services",
  estateManagementOffice: "Estate Management Office",
  communityHall: "Community Hall",
  placesOfWorship: "Places of Worship",
  coWorkingSpace: "Co-working Space",
  parcelDeliveryRoom: "Parcel Delivery Room",
  conciergeService: "Concierge Service",
  serviceCharge: "Service Charge",
  bar: "Bar",
  conferenceFacilities: "Conference Facilities",
  banquetHall: "Banquet Hall",
  roomService: "Room Service",
  spaFacilities: "Spa Facilities",
  eventSpace: "Event Space",
  businessCentre: "Business Centre",
  cleaningService: "Cleaning Service",
  receptionDesk: "Reception Desk",
  twentyFourHourCheckIn: "24-hour Check-in",
  selfCheckIn: "Self Check-in",
  freshBedLinen: "Fresh Bed Linen",
  towelsProvided: "Towels Provided",
  toiletriesProvided: "Toiletries Provided",
  sharedGym: "Shared Gym",

  certificateOfOccupancy: "Certificate of Occupancy (C of O)",
  governorsConsent: "Governor's Consent",
  registeredDeed: "Registered Deed",
  allocationLetter: "Allocation Letter",
  surveyPlanAvailable: "Survey Plan Available",
  deedOfAssignmentAvailable: "Deed of Assignment Available",
  gazetteStatus: "Gazette Status",
  excisionStatus: "Excision Status",
  landUseZoning: "Land Use/Zoning",
  residentialLandUse: "Residential Land Use",
  commercialLandUse: "Commercial Land Use",
  industrialLandUse: "Industrial Land Use",
  agriculturalLandUse: "Agricultural Land Use",
  mixedUseLandUse: "Mixed-use Land Use",
  plotDimensions: "Plot Dimensions",
  dryLand: "Dry Land",
  swampyTerrain: "Swampy Terrain",
  flatTerrain: "Flat Terrain",
  slopingTerrain: "Sloping Terrain",
  fencedLand: "Fenced Land",
  unfencedLand: "Unfenced Land",
  roadAccess: "Road Access",
  electricityAvailability: "Electricity Availability",
  waterAvailability: "Water Availability",
  developedArea: "Developed Area",
  undevelopedArea: "Undeveloped Area",
  estateLayoutApproval: "Estate Layout Approval",
  buildingApprovalStatus: "Building Approval Status",
  governmentAcquisitionStatus: "Government Acquisition Status",

  officeSuites: "Office Suites",
  conferenceRoom: "Conference Room",
  meetingRooms: "Meeting Rooms",
  openPlanOffice: "Open-plan Office",
  privateOffices: "Private Offices",
  retailShopFrontage: "Retail Shop Frontage",
  displayWindows: "Display Windows",
  warehouseSpace: "Warehouse Space",
  highCeilingHeight: "High Ceiling Height",
  heavyDutyFlooring: "Heavy-duty Flooring",
  customerWaitingArea: "Customer Waiting Area",

  warehouseFloorArea: "Warehouse Floor Area",
  ceilingClearHeight: "Ceiling/Clear Height",
  industrialFlooring: "Industrial Flooring",
  staffOffices: "Staff Offices",
  staffToilets: "Staff Toilets",
  staffChangingRooms: "Staff Changing Rooms",

  totalFarmArea: "Total Farm Area",
  soilType: "Soil Type",
  soilFertility: "Soil Fertility",
  farmhouse: "Farmhouse",
  storageBarn: "Storage Barn",
  farmWarehouse: "Farm Warehouse",
  livestockPen: "Livestock Pen",
  poultryHouse: "Poultry House",
  fishPond: "Fish Pond",
  greenhouse: "Greenhouse",
  farmEquipmentStorage: "Farm Equipment Storage",
  processingFacility: "Processing Facility",
  proximityToMarkets: "Proximity to Markets",

  wheelchairAccess: "Wheelchair Access",
  accessibleRamps: "Accessible Ramps",
  wheelchairFriendlyEntrance: "Wheelchair-friendly Entrance",
  accessibleBathroom: "Accessible Bathroom",
  handrails: "Handrails",
  stepFreeAccess: "Step-free Access",
  wideDoorways: "Wide Doorways",

  smartHome: "Smart Home",
  smartDoorLock: "Smart Door Lock",
  smartLighting: "Smart Lighting",
  smartThermostat: "Smart Thermostat",
  smartSecuritySystem: "Smart Security System",
  videoDoorbell: "Video Doorbell",
  remoteGateControl: "Remote Gate Control",
  motionSensors: "Motion Sensors",
  automatedLighting: "Automated Lighting",
  energyMonitoringSystem: "Energy Monitoring System",
  smartWaterManagement: "Smart Water Management",

  furnished: "Furnished",
  serviced: "Serviced",
};

export const MEDIA_SECTIONS = [
  { value: "general", label: "General" },
  { value: "bedrooms", label: "Bedrooms" },
  { value: "bathrooms", label: "Bathrooms" },
  { value: "total_area", label: "Total Area" },
  { value: "features", label: "Features & Amenities" },
];

export type MediaSection = (typeof MEDIA_SECTIONS)[number]["value"];