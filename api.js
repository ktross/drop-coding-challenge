const express = require('express')
const sqlite3 = require('sqlite3').verbose()
const http = require('https')
const app = express()

const config = {
    "port": 3000,
    "queueInterval": 3 // seconds
}

// Use middleware for parsing json payloads
app.use(express.json()) 

/**
 * Gracefully handle termination signals
 */

// Workaround for correctly emitting SIGINT (ctrl+c) event in Windows
if (process.platform === "win32") {
    var rl = require("readline").createInterface({
        input: process.stdin,
        output: process.stdout
    })
    rl.on("SIGINT", function () {
        process.emit("SIGINT")
    })
}

['SIGINT', 'SIGTERM', 'SIGHUP'].forEach(signal => process.on(signal, () => {
    console.log(`${signal} signal received. Exiting..`)
    db.close()
    process.exit()
}))


/**
 * Initialize DB in memory
 */
var db = new sqlite3.Database(':memory:')

db.serialize(function () {
    var jobsQuery = `CREATE TABLE "jobs" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "complete" INTEGER NOT NULL DEFAULT 0,
        "payload" TEXT NOT NULL,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`
    var jobResultsQuery = `CREATE TABLE "job_results" (
        "id" INTEGER PRIMARY KEY AUTOINCREMENT NOT NULL,
        "job_id" INTEGER NOT NULL,
        "result" BLOB NOT NULL,
        "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updated_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`
    db.run(jobsQuery)
    db.run(jobResultsQuery)
})


/**
 * Register routes
 */
app.get('/jobs', function (req, res) {
    db.all('SELECT id, complete, payload, created_at, updated_at FROM jobs', function (err, rows) {
        if (err !== null) {
            res.status(500).json(err)
        } else {
            res.json(rows)
        }
    })
})

app.post('/jobs', function (req, res) {
    db.run('INSERT INTO jobs (payload) VALUES (?)', req.body.payload, function (err) {
        if (err !== null) {
            res.status(500).json(err)
        } else {
            res.json({ id: this.lastID })
        }
    })
})

app.get('/jobs/:id', function (req, res) {
    db.get('SELECT id, complete, payload, created_at, updated_at FROM jobs WHERE jobs.id = ?', req.params.id, function (err, row) {
        if (err !== null) {
            res.status(500).json(err)
        } else {
            res.json(row)
        }
    })
})

app.delete('/jobs/:id', function (req, res) {
    // Would normally use transactions or a trigger to prevent orphaned records
    db.run('DELETE FROM job_results WHERE job_results.job_id = ?', req.params.id)
    db.run('DELETE FROM jobs WHERE jobs.id = ?', req.params.id)
    res.status(200).send()
})

app.get('/jobs/:id/results', function (req, res) {
    db.get('SELECT id, job_id, result, created_at, updated_at FROM job_results WHERE job_id = ?', req.params.id, function (err, row) {
        if (err !== null) {
            res.status(500).json(err)
        } else {
            res.json(row)
        }
    })
})


/**
 * Listen for connections
 */
app.listen(config.port, () => console.log(`API listening on port ${config.port}..`))


/**
 * Set timer to process queue
 */
var timer = setInterval(() => {
    db.get('SELECT id, complete, payload, created_at FROM jobs WHERE jobs.complete = 0 ORDER BY created_at ASC', function (err, row) {
        if (err === null && typeof row !== "undefined") {
            var jobID = row.id
            http.get(row.payload, (res) => {
                const { statusCode } = res;
                if (statusCode === 200) {
                    let result = ''
                    res.on('data', (chunk) => {
                        result += chunk
                    })
                    res.on('end', () => {
                        db.run('INSERT INTO job_results (job_id, result) VALUES (?, ?)', [jobID, result])
                        db.run('UPDATE jobs SET complete = 1 WHERE id = ?', jobID)
                        console.log(`Processed queue for Job #${jobID}.`)
                    })
                }
            })
        }
    })
}, config.queueInterval * 1000)