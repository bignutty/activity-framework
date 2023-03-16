import './style.css';

import ActivityInstance from '../activity-framework';

if (process.env.NODE_ENV !== 'production') {
  console.log('Activity running in development mode.');
};

(async () => {
  const activity = new ActivityInstance("909186215721467974", "https://localhost:3000");
  await activity.run();
  console.log('Activity is ready and authorised!')

  // Hide the splash screen
  document.getElementById('splashScreen').style.opacity = 0;
  document.getElementById('splashScreen').style.pointerEvents = "none";
  setTimeout(() => {
    document.getElementById('splashScreen').style.display = 'none';
  }, 1500)
  
  let user = await activity.getCurrentUser();
  document.getElementById('welcomeHeader').innerText = 'Hello, ' + user.username

  // Show the activity screen
  document.getElementById('activityScreen').style.display = 'block';

  // Update the users activity
  await activity.setActivity({
    activity: {
      type: 0,
      details: `activity-framework Example Application`,
      assets: {
        large_image: "icon",
        large_text: "activity-framework Example Application"
      }
    }
  })

  document.getElementById("activityClose").addEventListener("click", async ()=>{
    activity.closeEmbeddedActivity("Goodbye!")
  })
})();