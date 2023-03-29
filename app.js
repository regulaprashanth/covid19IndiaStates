const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "covid19India.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3003, () => {
      console.log("Server Running at http://localhost:3003/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();

//API 1
app.get("/states/", async (request, response) => {
  const statesListQuery = `
    SELECT
    *
    FROM 
    state
    ORDER BY 
    state_id;`;
  const statesArray = await db.all(statesListQuery);
  const convertDBObjectToResponseObject = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };
  response.send(
    statesArray.map((eachState) => convertDBObjectToResponseObject(eachState))
  );
});

//API 2
app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const stateIdQuery = `
    SELECT 
    *
    FROM 
    state
    WHERE
    state_id=${stateId}`;
  const responseState = await db.get(stateIdQuery);
  const convertDBObjectToResponseObject = (dbObject) => {
    return {
      stateId: dbObject.state_id,
      stateName: dbObject.state_name,
      population: dbObject.population,
    };
  };
  response.send(convertDBObjectToResponseObject(responseState));
});

//API 3
app.post("/districts/", async (request, response) => {
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const newDistrictQuery = `
    INSERT INTO
      district(district_name,state_id,cases,cured,active,deaths)
    VALUES
      ('${districtName}',
      ${stateId},
      ${cases},
      ${cured},
      ${active},
      ${deaths});`;
  await db.run(newDistrictQuery);
  response.send("District Successfully Added");
});

//API 4
app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictWithIdQuery = `
SELECT 
*
FROM 
district
WHERE
 district_id=${districtId};`;
  const responseDistrict = await db.get(getDistrictWithIdQuery);
  const convertDBObjectToResponseObject = (dbObject) => {
    return {
      districtId: dbObject.district_id,
      districtName: dbObject.district_name,
      stateId: dbObject.state_id,
      cases: dbObject.cases,
      cured: dbObject.cured,
      active: dbObject.active,
      deaths: dbObject.deaths,
    };
  };
  response.send(convertDBObjectToResponseObject(responseDistrict));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteQuery = `
    DELETE FROM
     district
    WHERE
     district_id=${districtId};`;
  await db.run(deleteQuery);
  response.send("District Removed");
});

//API 6
app.put("/districts/:districtId", async (request, response) => {
  const { districtId } = request.params;
  const districtDetails = request.body;
  const {
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  } = districtDetails;
  const updateDistrictQuery = `
    UPDATE
      district
    SET
      district_name='${districtName}',
      state_id=${stateId},
      cases=${cases},
      cured=${cured},
      active=${active},
      deaths=${deaths}
    WHERE
      district_id=${districtId};`;

  await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7
app.get("/states/:stateId/stats", async (request, response) => {
  const { stateId } = request.params;
  const getStateStatsQuery = `
    SELECT
       SUM(cases),
       SUM(cured),
       SUM(active),
       SUM(deaths)
    FROM 
       district
    WHERE
       state_id=${stateId};`;
  const stats = await db.get(getStateStatsQuery);
  response.send({
    totalCases: stats["SUM(cases)"],
    totalCured: stats["SUM(cured)"],
    totalActive: stats["SUM(active)"],
    totalDeaths: stats["SUM(deaths)"],
  });
});

//API 8
app.get("/districts/:districtId/details", async (request, response) => {
  const { districtId } = request.params;
  const getStateIdQuery = `
    SELECT
     state_id
    FROM
    district
    WHERE
    district_id=${districtId};`;
  const stateIdResponse = await db.get(getStateIdQuery);

  const getStateNameQuery = `
  SELECT
    state_name as stateName
  FROM  
    state
  WHERE
    state_id=${stateIdResponse.state_id};`;
  const stateName = await db.get(getStateNameQuery);
  response.send(stateName);
});

module.exports = app;
