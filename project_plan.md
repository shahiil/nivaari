Below is a structured Markdown specification that captures the concept, architecture, and functional design of your project in a clear way so it can later be used for development, documentation, or onboarding contributors.

⸻

NIVAARI – System Design & Concept Documentation

1. Overview

NIVAARI is a decentralized, user-driven geographic intelligence platform where users contribute and verify real-world information through an interactive tile-based map.

Unlike traditional map platforms (e.g., satellite maps), NIVAARI represents the world as a dynamic grid of tiles, where each tile contains structured information about:
	•	infrastructure
	•	services
	•	environment
	•	emergencies
	•	social signals
	•	infrastructure health
	•	transportation
	•	disasters
	•	civic information

Users interact with tiles, update their information, vote on accuracy, and report events through natural conversation with NIVAARI AI.

The system is designed to operate with minimal identity requirements, prioritizing autonomy, anonymity, and decentralized data contribution.

⸻

3. Platform Access Model

NIVAARI is deployed as a Progressive Web App (PWA).

User Flow
	1.	User opens browser
	2.	Visits NIVAARI website
	3.	Adds app to home screen
	4.	Launches the app

Compatible with:
	•	Android
	•	iOS
	•	Desktop browsers

⸻

4. Account System

The platform avoids traditional identity collection.

Account Creation

When user selects Create Account:

System generates:
	•	Social ID
	•	Recovery Key
	•	Authentication Token

User is prompted to:
	•	Download credentials
	•	Copy credentials
	•	Store credentials safely

No personal data collected:
	•	No phone number
	•	No email
	•	No KYC

This ensures privacy and autonomy.

⸻

Account Recovery

User inputs:
	•	Social ID
	•	Recovery Key

System regenerates authentication token.

⸻

5. Permissions Requested

After login:

User is prompted for:
	1.	Location Access
	2.	Notification Access

These enable:
	•	map positioning
	•	local alerts
	•	emergency updates
	•	disaster warnings

⸻

6. Map System

The NIVAARI map is not a satellite or road map.

It is a data-driven tile grid.

Tile Characteristics

Each tile contains structured metadata about the physical world.

Tiles may represent:
	•	buildings
	•	roads
	•	forests
	•	water bodies
	•	public infrastructure
	•	events

Tiles are retrieved from a Tile Information Server.

For now:
	•	dummy tile data can be used.

⸻

7. Tile Architecture

Basic Tile

A tile is a grid unit with attributes.

Example:

Tile
{
  id
  coordinates
  category
  zone
  statistics
  services
  votes
  shape
}


⸻

Composite Tiles

Tiles can merge into larger shapes.

Example:

Building = 4 x 3 tiles
Park = 10 x 8 tiles
Lake = irregular tile grouping

Tile shapes are editable by users.

⸻

8. Tile Interaction

Mobile Interaction

Long press a tile.

Opens Tile Information Modal.

⸻

Tile Information Includes
	•	category
	•	zone
	•	services
	•	environmental indicators
	•	infrastructure type
	•	statistics
	•	votes

Users can:
	•	upvote
	•	downvote
	•	suggest updates

⸻

9. Tile Editing

Users can propose edits if information is incorrect.

Editable Data
	•	building type
	•	land usage
	•	service availability
	•	pollution level
	•	safety indicators
	•	disaster risk
	•	infrastructure condition

⸻

10. Tile Shape Correction

Users may modify tile boundaries.

Example scenario:

Actual building:

4 x 3 tiles

Incorrect map:

4 x 4 tiles

User correction process:
	1.	Select edit shape
	2.	Choose tiles like movie seat selection
	3.	Submit correction

The system stores proposals for verification.

⸻

11. Travel Mode

User can activate Travel Mode.

Options:
	•	train
	•	bus
	•	car
	•	walking
	•	ship
	•	aircraft

Behavior

As the user moves:
	•	system detects travel path
	•	tiles are automatically marked as:

road
rail
sea route
air route

This crowdsources transportation infrastructure.

⸻

12. NIVAARI AI

NIVAARI AI acts as a field data assistant.

Users can report tile information via conversation.

Example interaction:

User:

This building is a hospital and it’s very crowded.

AI asks structured questions:
	•	What type of hospital?
	•	Public or private?
	•	Approximate capacity?
	•	Emergency services available?

⸻

AI Output

After conversation:

AI generates structured report.

Example JSON:

{
  "tile_id": "TX_20991",
  "category": "health",
  "type": "hospital",
  "attributes": {
    "crowd_level": "high",
    "emergency_services": true,
    "public": true
  },
  "confidence": 0.82
}

This is sent to backend.

⸻

13. Quick Report System

A Quick Report button allows instant reporting.

Workflow:
	1.	Capture current location
	2.	Launch conversation with AI
	3.	AI collects details
	4.	Generates structured tile report
	5.	Sends JSON to backend

⸻

14. Map Filters

Users can toggle data layers.

Examples:
	•	residential zones
	•	danger zones
	•	pollution heatmaps
	•	services
	•	transportation
	•	disasters
	•	infrastructure health

⸻

15. Categories of Services

Tiles can contain services across domains.

Traffic

Transportation and congestion monitoring.

Pollution
	•	air
	•	water
	•	land
	•	noise

Nature
	•	lakes
	•	rivers
	•	seaside
	•	gardens
	•	trees
	•	parks

Entertainment
	•	sports facilities
	•	cinemas
	•	clubs
	•	resorts
	•	retail

Food
	•	restaurants
	•	street food stalls
	•	grocery stores
	•	fast food chains

Health
	•	dental
	•	physical healthcare
	•	mental health services

Safety
	•	police stations
	•	fire stations
	•	hospitals
	•	military bases

Security

Community and institutional security infrastructure.

Energy

Power infrastructure.

Water

Water supply systems.

Transportation

Infrastructure across all travel types.

Fire

Fire hazards and fire services.

Education
	•	schools
	•	colleges
	•	universities

Culture
	•	heritage sites
	•	cultural landmarks

Government

Public institutions.

Funeral Services

Cemeteries and cremation infrastructure.

Finance
	•	banks
	•	stock institutions
	•	real estate services

Residence
	•	lands
	•	properties
	•	lodges
	•	housing

Waste Management

Garbage collection and disposal.

Internet Services

Connectivity infrastructure.

⸻

16. Emergency Systems

Tiles can be linked to emergency services.

Types include:
	•	water tankers
	•	police
	•	ambulance
	•	garbage collectors
	•	fire brigade
	•	SWAT
	•	military

⸻

17. Zone Classification

Each tile can belong to a zone type.

Zone Types
	•	commercial
	•	residential
	•	semi-residential
	•	industrial
	•	agriculture
	•	forest
	•	harbour

⸻

18. Transport Types

Tiles may contain transportation data.

Types
	•	air
	•	land
	•	sea

⸻

19. Disaster Classification

Disasters are categorized into two major groups.

⸻

Man-Made Disasters
	•	fire
	•	epidemic
	•	riots
	•	terrorism
	•	flooding
	•	technical failure
	•	social unrest
	•	warfare
	•	deforestation

⸻

Natural Disasters
	•	tornadoes
	•	hurricanes
	•	earthquakes
	•	tsunamis
	•	meteorites
	•	storms
	•	cloud bursts
	•	pest infestations

⸻

20. Hierarchy Model

NIVAARI uses a multi-level spatial hierarchy.

World
 └ Country
     └ State
         └ District
             └ Town
                 └ Houses/Bungalows
                     └ Citizens

Urban hierarchy:

City
 └ Residential Zone
     └ Society
         └ Building
             └ Floor
                 └ Flat
                     └ Citizen

This hierarchy helps with:
	•	statistics
	•	governance
	•	service distribution
	•	resource tracking

⸻

21. Statistical Indicators

Each tile or area may maintain statistics.

Mood

Citizen sentiment.

Service Levels

Performance indicators for:
	•	healthcare
	•	water supply
	•	electricity
	•	waste management
	•	security

Satisfaction Levels

Citizen satisfaction index.

City Revenue Predictions

Economic forecasting.

Structure Health

Tracks:
	•	infrastructure age
	•	maintenance status
	•	risk indicators

Historical Structure Data

Tracks how the area evolved over time.

Examples:
	•	land use change
	•	urbanization patterns
	•	environmental changes

⸻

22. Data Philosophy

NIVAARI is built on three principles:

1. Decentralized Knowledge

Information is contributed by citizens.

2. Verifiable Data

Voting and multiple reports improve accuracy.

3. AI Assisted Reporting

NIVAARI AI converts natural language into structured data.

⸻

23. Future Expansion

Possible future capabilities:
	•	autonomous disaster detection
	•	predictive urban analytics
	•	infrastructure health forecasting
	•	crowd intelligence
	•	AI moderation of reports
	•	decentralized governance tools
	•	public planning tools