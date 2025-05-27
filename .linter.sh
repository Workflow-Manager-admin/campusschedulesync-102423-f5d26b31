#!/bin/bash
cd /home/kavia/workspace/code-generation/campusschedulesync-102423-f5d26b31/campus_schedule_sync
npm run build
EXIT_CODE=$?
if [ $EXIT_CODE -ne 0 ]; then
   exit 1
fi

