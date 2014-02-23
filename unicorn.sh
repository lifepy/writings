#!/bin/sh
UNICORN='bundle exec unicorn'
CONFIG_FILE=config/unicorn.rb
PID_FILE=tmp/pids/unicorn.pid

case "$1" in
  start)
  $UNICORN -c $CONFIG_FILE -E production -D
  ;;
  stop)
  kill -QUIT `cat $PID_FILE`
  ;;
  restart|force-reload)
    kill -USR2 `cat $PID_FILE`
  ;;
  *)
   echo "Usage: $SCRIPTNAME {start|stop|restart|force-reload}" >&2
   exit 3
   ;;
esac 
