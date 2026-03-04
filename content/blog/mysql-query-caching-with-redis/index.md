+++
date = '2023-01-06T11:57:17+05:30'
draft = false
title = 'Mysql Query Caching With Redis'
tags = ['mysql', 'redis', 'performance']
aliases = ["/blog/mysql-query-caching-with-redis/16/"]
+++
By keeping frequently visited data in a temporary storage place known as a cache, caching is a common software development approach used to increase system efficiency. As a result, the system can access the data more quickly than if it had to go back to the original data source each time.

Caching can be done using a variety of different technologies, such as MySQL and Redis. We'll look at both of these technologies in this post and see how they may be applied to caching.

## MySQL

Frequently used to store and retrieve data for web-based applications, MySQL is a well-known open-source relational database management system (RDBMS). Data that is stored in tables is managed and manipulated using SQL, or structured query language.

Creating a unique database or table just for caching reasons is one technique to use MySQL for caching. The cached data would be kept in this table along with a key and a timestamp to show when the data was most recently updated.

If you are already using MySQL as your primary database then you can use the table cache method. By using this approach, you can also cache complex data structures, as MySQL supports a wide range of data types and can store structured data in tables.

However, I strongly recommend keeping the cache data store separate and my choice of weapon is **Redis**.

## Redis

Redis is a key-value in-memory data store that can be used as a cache, a message broker, or a database. Redis is popular for its high performance and scalability and is often used in situations where a high level of throughput is required.

Like MySQL, Redis can be used to store cached data in a key-value format. However, unlike MySQL, which stores data on disk, Redis stores all of its data in memory. This makes it extremely fast for reading and writing data, but also means that **it can't store as much data as a disk-based system like MySQL.**

## MySQL Query Caching with Redis

Let's see how we can use Redis as a cache store while using MySQL as a primary data store.

In a nutshell, you need to set up a Redis server along with a MySQL server and use it to store cached data in memory. When a request for data is made, the application needs to check the Redis cache to see if the data is present. If it is, the application can retrieve the data from the cache and use it.

If the data is not present or has expired, the application can retrieve the data from the original source and update the cache in Redis.

Let's learn it with an example. Here is a GoLang code that demonstrates how we can use Redis with MySQL. Assuming MySQL and Redis is installed in the machine.
```javascript
    package main
    
    import (
    	"database/sql"
    	"fmt"
    	"log"
    
    	"github.com/go-redis/redis"
    	_ "github.com/go-sql-driver/mysql"
    )
    
    // User represents a user in the database
    type User struct {
    	ID   int
    	Name string
    }
    
    func main() {
    	// Connect to the MySQL database
    	db, err := sql.Open("mysql", "user:password@/database")
    	if err != nil {
    		log.Fatal(err)
    	}
    	defer db.Close()
    
    	// Connect to the Redis cache
    	cache := redis.NewClient(&redis.Options{
    		Addr: "localhost:6379",
    	})
    
    	// Get a user from the database or cache
    	var user User
    	key := "user:1"
    	val, err := cache.Get(key).Result()
    	if err == redis.Nil {
    		// Key not found in cache, get it from the database
    		err = db.QueryRow("SELECT id, name FROM users WHERE id = ?", 1).Scan(&user.ID, &user.Name)
    		if err != nil {
    			log.Fatal(err)
    		}
    
    		// Save the user to the cache
    		cache.Set(key, user, 0)
    	} else if err != nil {
    		log.Fatal(err)
    	} else {
    		// Key found in cache, decode it
    		fmt.Sscanf(val, "%d %s", &user.ID, &user.Name)
    	}
    
    	fmt.Println(user)
    }
```    

Let's understand the code. First, we connect to a MySQL database and a Redis cache. Then code tries to get a user with a specific ID from the cache. If the key is not found in the cache, it retrieves the user from the MySQL database and saves it to the cache. If the key is found in the cache, it decodes the value and creates a User struct from it.

Let's take a look at another example written in Node.js.
```javascript
    const mysql = require('mysql');
    const redis = require('redis');
    
    // Connect to the MySQL database
    const db = mysql.createConnection({
      host: 'localhost',
      user: 'user',
      password: 'password',
      database: 'database'
    });
    
    // Connect to the Redis cache
    const cache = redis.createClient({
      host: 'localhost',
      port: 6379
    });
    
    // Get a user from the database or cache
    const getUser = id => {
      return new Promise((resolve, reject) => {
        cache.get(`user:${id}`, (err, result) => {
          if (result) {
            // Key found in cache, return the result
            return resolve(JSON.parse(result));
          } else {
            // Key not found in cache, get it from the database
            db.query(`SELECT id, name FROM users WHERE id = ${id}`, (err, results) => {
              if (err) return reject(err);
              const user = results[0];
    
              // Save the user to the cache
              cache.set(`user:${id}`, JSON.stringify(user), 'EX', 3600);
    
              return resolve(user);
            });
          }
        });
      });
    };
    
    getUser(1).then(user => {
      console.log(user);
    });
```    

Again, the code shown above will first connect to a MySQL database and a Redis cache. We are defining a  function **getUser** that takes an ID as a parameter and returns a promise that resolves to a user object. The function tries to get the user from the cache by its user ID present in the parameter.

If the key is not found in the cache (i.e., the result is null), it retrieves the user from the MySQL table and saves it to the cache. If the key is found in the cache, it parses the value and returns it as a JavaScript object.

## Conclusion

Both MySQL and Redis can be used as effective caching technologies, depending on the needs of your application. MySQL is a good choice for caching structured data and for situations where you are already using MySQL as your primary data store. Redis is a good choice for caching large amounts of data and for situations where very fast read and write performance is required. I have used this combination in various solutions and it never ceases to amaze me.
