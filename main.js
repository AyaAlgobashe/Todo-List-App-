var idbApp = (function () {
    'use strict';

    var dbPromise = idb.open('ToDoDB', 3, function (upgradeDb) {
        var tasksStore = upgradeDb.createObjectStore('tasks', { keyPath: 'taskId', autoIncrement: true });
        tasksStore.createIndex('hours', 'hours', { unique: false });
        tasksStore.createIndex('minutes', 'minutes', { unique: false });
        tasksStore.createIndex('finished', 'finished', { unique: false });
    });

    function addTask() {
        var taskTitle = document.getElementById('taskTitle').value;
        var taskHours = document.getElementById('taskHours').value;
        var taskMinutes = document.getElementById('taskMinutes').value;
        var taskDate = document.getElementById('taskDate').value;

        dbPromise.then(function (db) {
            var tx = db.transaction('tasks', 'readwrite');
            var store = tx.objectStore('tasks');

            var formattedHours = ('0' + taskHours).slice(-2);
            var formattedMinutes = ('0' + taskMinutes).slice(-2);

            var task = {
                title: taskTitle,
                date: taskDate,
                hours: parseInt(formattedHours),
                minutes: parseInt(formattedMinutes)
            };

            store.add(task);
            return tx.complete;
        }).then(function () {
            console.log('Task added successfully');
            displayTasks();

            
            showNotification('Task Added', 'Task "' + taskTitle + '" has been added.');
        }).catch(function (error) {
            console.error('Error adding task:', error);
        });
    }

    function deleteTask(taskId) {
        var taskTitle;

        dbPromise.then(function (db) {
            var tx = db.transaction('tasks', 'readwrite');
            var store = tx.objectStore('tasks');

            return store.get(taskId);
        }).then(function (task) {
            if (task) {
                taskTitle = task.title;
            }

            var deleteTx = dbPromise.then(function (db) {
                var tx = db.transaction('tasks', 'readwrite');
                var store = tx.objectStore('tasks');
                store.delete(taskId);
                return tx.complete;
            });

            return Promise.all([deleteTx, taskTitle]);
        }).then(function (results) {
            var deletedTaskTitle = results[1];
            console.log('Task deleted successfully');
            displayTasks();
            showNotification('Task Deleted', 'Task "' + deletedTaskTitle + '" has been deleted.');
        }).catch(function (error) {
            console.error('Error deleting task:', error);
        });
    }

    function displayTasks() {
        var taskList = document.getElementById('taskList');

        dbPromise.then(function (db) {
            var tx = db.transaction('tasks', 'readonly');
            var store = tx.objectStore('tasks');

            return store.getAll();
        }).then(function (tasks) {
            taskList.innerHTML = '';

            tasks.forEach(function (task) {
                var taskItem = document.createElement('div');

                var formattedDate = new Date(task.date);
                var formattedHours = ('0' + task.hours).slice(-2);
                var formattedMinutes = ('0' + task.minutes).slice(-2);

                var displayDate = formattedDate.toLocaleDateString('en-US', {
                    month: 'numeric',
                    day: 'numeric',
                    year: 'numeric'
                });

                var displayTime = formattedHours + ':' + formattedMinutes;

                taskItem.innerHTML = '<p>' + task.title + ' - ' + displayDate + ' ' + displayTime +
                    ' <button class="btn btn-dark text-light" onclick="idbApp.deleteTask(' + task.taskId + ')">Delete</button></p>';

                taskList.appendChild(taskItem);
            });
        }).catch(function (error) {
            console.error('Error retrieving tasks:', error);
        });
    }

    function requestNotificationPermission() {
        Notification.requestPermission().then(function (permission) {
            console.log('Notification permission:', permission);
            if (permission === 'granted') {
                showNotification('Notifications Allowed', 'You will now receive notifications.');
            }
        });
    }

    function showNotification(title, body, task) {
        if ('Notification' in window) {
            Notification.requestPermission().then(function (permission) {
                console.log('Notification permission:', permission);
                if (permission === 'granted') {
                    var options = {
                        body: body,
                        icon: 'path/to/your/icon.png'
                    };
    
                    new Notification(title, options);
                }
            });
        }
    }

    function finishTask(taskId) {
        var task;
    
        dbPromise
            .then(function (db) {
                var tx = db.transaction('tasks', 'readwrite');
                var store = tx.objectStore('tasks');
    
                return store.get(taskId);
            })
            .then(function (resultTask) {
                task = resultTask;
    
                if (task) {
                    task.finished = true;
                    task.finishedTime = new Date();
    
                    var updateTx = dbPromise.then(function (db) {
                        var tx = db.transaction('tasks', 'readwrite');
                        var store = tx.objectStore('tasks');
                        store.put(task);
                        return tx.complete;
                    });
    
                    return updateTx;
                }
            })
            .then(function () {
                console.log('Task marked as finished successfully');
                displayTasks();
                showNotification('Task Finished', 'Task "' + task.title + '" has been finished.', task);
            })
            .catch(function (error) {
                console.error('Error marking task as finished:', error);
            });
    }
    
    return {
        dbPromise: dbPromise,
        addTask: addTask,
        deleteTask: deleteTask,
        displayTasks: displayTasks,
        requestNotificationPermission: requestNotificationPermission,
        finishTask: finishTask
    };
})();
