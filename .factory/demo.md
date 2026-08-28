# Home Care Evidence demo

Open <https://home-care-evidence.sociobot.in/demo> or select **Try it with sample data** on the first screen.

The demo opens with three editable maintenance cards: a water-heater flush with a sample receipt, an attic-hatch weather seal with a sample photo, and a dryer-vent cleanout. This data is enough to exercise recurrence, history, search, open export, encrypted export after a test license is supplied, printing, offline reload, and the free-card limit.

Demo records use the IndexedDB database `demo:home-care-evidence`. Demo license state uses localStorage keys prefixed with `demo:`. The normal database `home-care-evidence` and normal `sb_license:*` keys are never read or written in demo mode.

**Reset demo** replaces only the demo database with the original three cards. **Start for real** clears the demo database and demo license keys, then opens `/`. A new visit to `/demo` seeds a fresh sample when its isolated database is empty.
