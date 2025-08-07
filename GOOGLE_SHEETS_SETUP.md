# Google Sheets Challenge Management Setup

This guide shows how to set up Google Sheets as a content management system for League Bingo challenges.

## Sheet Structure

Create a Google Sheet with the following columns:

| Column | Type | Description | Example |
|--------|------|-------------|---------|
| A: id | string | Unique identifier | "pentakill_001" |
| B: text | string | Challenge description | "Get a Pentakill" |
| C: category | string | Challenge category | "performance" |
| D: difficulty | string | Difficulty level | "hard" |
| E: points | number | Points awarded | 40 |
| F: roles | string | Comma-separated roles | "adc,mid" or "all" |
| G: requiresConfirmation | boolean | Needs GM approval | TRUE/FALSE |
| H: description | string | Optional detailed description | "Kill 5 enemies within 10 seconds" |
| I: tags | string | Comma-separated tags | "teamfight,skill" |
| J: enabled | boolean | Is challenge active | TRUE/FALSE |

## Example Sheet Data

```
id                    | text                           | category    | difficulty | points | roles      | requiresConfirmation | description | tags           | enabled
pentakill_001        | Get a Pentakill                | performance | hard       | 40     | all        | TRUE                 |             | teamfight,skill| TRUE
first_blood_001      | Get First Blood                | performance | medium     | 15     | all        | FALSE                |             | early,skill    | TRUE
baron_steal_001      | Steal Baron from Enemy         | events      | hard       | 35     | jungle     | TRUE                 |             | objective,steal| TRUE
flash_wall_001       | Flash Into a Wall              | social      | easy       | 5      | all        | FALSE                |             | mistake,funny  | TRUE
ward_pink_001        | Place 10 Control Wards         | performance | medium     | 20     | support    | FALSE                |             | vision,support | TRUE
```

## Google Sheets API Setup

### 1. Create Google Cloud Project
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create new project: "League Bingo"
3. Enable Google Sheets API

### 2. Create Service Account
1. Go to IAM & Admin → Service Accounts
2. Create service account: "league-bingo-sheets"
3. Download JSON key file
4. Save as `google-sheets-key.json`

### 3. Share Sheet with Service Account
1. Copy service account email from JSON file
2. Share your Google Sheet with this email
3. Give "Viewer" permissions

### 4. Get Sheet ID
From your Google Sheets URL:
`https://docs.google.com/spreadsheets/d/SHEET_ID_HERE/edit`

### 5. Environment Variables
```env
GOOGLE_SHEETS_KEY_FILE=./google-sheets-key.json
GOOGLE_SHEETS_ID=your_sheet_id_here
GOOGLE_SHEETS_RANGE=Sheet1!A2:J1000
```

## Sheet Management Tips

### Categories
- `performance`: Skill-based challenges
- `social`: Player interaction/behavior
- `events`: Game events and objectives
- `missions`: Time-based or conditional tasks

### Difficulty Levels
- `easy`: 5-10 points, common occurrences
- `medium`: 15-25 points, moderate skill/luck
- `hard`: 30-50 points, rare/high skill

### Roles
- `all`: Any role can complete
- `top,jungle,mid,adc,support`: Specific roles
- Use comma separation for multiple roles

### Best Practices
1. **Unique IDs**: Use descriptive, unique identifiers
2. **Clear Text**: Keep challenge text concise but clear
3. **Balanced Points**: Scale points with difficulty/rarity
4. **Test Challenges**: Ensure challenges are achievable
5. **Regular Updates**: Remove outdated/problematic challenges

## Template Sheet

Copy this template: [League Bingo Challenges Template](https://docs.google.com/spreadsheets/d/TEMPLATE_ID/copy)

Or create manually with the structure above and populate with initial challenges.