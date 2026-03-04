+++
date = '2023-01-09T11:57:36+05:30'
draft = false
title = 'Sql Query to Check if Name Begins and Ends With Vowels'
tags = ['sql','tips']
aliases = ["/blog/sql-query-to-check-if-name-begins-and-ends-with-vowels/24/"]
+++
Here is a SQL query to check if the name begins and ends with vowels. Assuming you are running this in a MySQL database engine.
```sql
SELECT NAME
FROM USERS
WHERE NAME RLIKE '^[AEIOU].*[aeiou]$'
```
Here we are using RLIKE operator to run a regular expression against a column. The regular expression contains the check against the first and last characters with the vowels alphabet in both capital and small letters.

It would be best if you had the USERS table in your database and data containing some names to run the query.


