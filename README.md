# Atlas Intelligence

Build a professional geopolitical intelligence research application called "Political Intelligence Atlas."

The purpose of this application is to help a user study, organize, and analyze global political information. It should function as a personal intelligence database combining an interactive world map, political encyclopedia, research archive, and memorization system.

The application should have a professional analyst/research interface similar to a geopolitical monitoring platform.

Design:

- Dark mode interface

- Professional intelligence dashboard aesthetic

- Clean data visualization

- Easy navigation

- Modern responsive web application

- Prioritize information organization over flashy design

CORE FEATURE: INTERACTIVE WORLD MAP

Create an accurate interactive GIS-style world map as the primary navigation feature.

Requirements:

- Use a real geographic mapping system, not an image.

- Use accurate country boundaries.

- Use real geographic data such as GeoJSON/vector map data.

- Support smooth zooming and panning.

- Allow users to explore the entire world.

- Country borders and labels should adjust dynamically depending on zoom level.

Map behavior:

- Zoomed out:

  - Show continents and major countries.

  - Show simplified labels.

- Zoomed in:

  - Show detailed country borders.

  - Show smaller countries.

  - Adjust labels automatically.

  - Prevent overlapping text.

User flow:

Open app

↓

Interactive world map

↓

Click a country

↓

Open country profile page

COUNTRY PROFILE PAGE

Each country should have a detailed intelligence profile.

Include:

Basic Information:

- Country name

- Flag

- Region

- Capital

- Population

- GDP

- Government type

- Political system

- Current head of state

- Current head of government

Political Overview:

- Major political parties

- Ideologies

- Political stability

- Democracy rating

- Corruption rating

- Major political issues

- Key allies

- Key rivalries

- International organizations

Security and Conflict:

- Current conflicts

- Historical conflicts

- Military information

- Insurgencies

- Terrorism risks

- Border disputes

Timeline:

Display major historical and political events chronologically.

Connected Data:

Every country should connect to:

- Political figures

- Organizations

- Events

- Statistics

- Sources

- Research notes

DATABASE STRUCTURE

Create these connected databases:

1. Countries

Fields:

- Name

- Flag

- Region

- Coordinates

- Population

- GDP

- Government type

- Political system

- Leaders

- Political issues

- Stability rating

- Importance level

- Last updated

- Research notes

2. Political Figures

Fields:

- Name

- Country

- Position

- Political party

- Ideology

- Biography

- Important actions

- Related events

- Related organizations

- Sources

3. Political Events

Fields:

- Event name

- Date

- Location

- Countries involved

- Event type:

  - Election

  - Protest

  - Revolution

  - Coup

  - War

  - Treaty

  - Crisis

- Causes

- Key actors

- Consequences

- Timeline

- Sources

4. Organizations

Fields:

- Name

- Type

- Founding date

- Purpose

- Members

- Countries connected

- Leaders

- Related events

- Sources

5. Statistics

Fields:

- Country

- Category

- Statistic name

- Value

- Year

- Methodology

- Source

6. Sources

Create a complete source tracking system.

Fields:

- Source title

- Publisher

- URL

- Date published

- Date accessed

- Source type:

  - Government report

  - Academic paper

  - News article

  - NGO report

  - Think tank

  - Database

  - Book

- Reliability rating:

  - High

  - Medium

  - Low

- Summary

- Information used

- Notes

Every important piece of information should be connected to a source.

ANALYST FEATURES

Add:

Importance Level:

- Critical

- High

- Medium

- Low

Confidence Level:

- Confirmed

- Likely

- Disputed

- Unknown

"Why This Matters" field:

Explain why a fact is strategically important.

Example:

Instead of:

"Serbia population: 6.6 million"

Include:

"Serbia is strategically important because of EU integration, Russian influence, and Kosovo-related tensions."

Add:

- Research notes

- Last updated date

- Ability to tag information

DASHBOARD

Create a research dashboard showing:

- Countries tracked

- Political figures tracked

- Active conflicts

- Recent updates

- Upcoming elections

- High priority topics

Navigation:

- World Map

- Countries

- People

- Events

- Organizations

- Statistics

- Sources

- Study Mode

STUDY MODE

Create a memorization system.

Features:

- Flashcards

- Questions and answers

- Related country

- Related person

- Related event

- Difficulty level

- Review history

The purpose is to help memorize:

- Leaders

- Countries

- Political systems

- Historical events

- Conflicts

- Organizations

- Statistics

TECHNICAL REQUIREMENTS

Use:

- A real database backend

- Relational data structure

- Search functionality

- Filtering

- Linked records

- Interactive map integration

Prioritize building the foundation correctly:

1. Database structure

2. Interactive map

3. Country profiles

4. Connected records

5. Research tools

6. Study system

Do not create placeholder pages. Build functional connected features.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/9e6dc537-b4e1-4b52-830d-1a25659c839a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
