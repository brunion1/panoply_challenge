function generatePodcast(episode, campaigns){
    //structure of episode and compatible ad campaign id
    // { audio: "[PRE]+++++[MID]+++++", id: "dag-892" }
    // { audio: "+++++[MID]++++[MID]++++[POST]", id: "kld-412" }

    //structure of ad 
    /*
        [
            { audio: "*AcmeA*", type: "PRE", targets: ["dag-523"], revenue: 12 },
            { audio: "*AcmeB*", type: "MID", targets: ["dag-523"], revenue: 4 },
            { audio: "*AcmeC*", type: "MID", targets: ["dag-523"], revenue: 14 }
        ]
    */

    /* we need to break this down into steps
    Step 1: Filter out incompatible campaigns for audio file
    Step 2: Analyze string to see what rolls are available
    Step 3: Get list of compatible campaigns
    Step 4: Analyze list of compatible campaigns to see which is pointed highest
    Step 5: Replace string with campaign selected
    Step 6: Remove campaign from list
    Step 7: Rerun against step 3
    Step 8: If nothing returned from step 6, remove all ad slots from the podcast and return
    */
    
    var availableCampaigns = getAvailableCampaigns(episode.id, campaigns); //Step 1: This returns a list of valid ad campaigns 
    var audioString = episode.audio; // audio string to be converted
    var compatibleCampaigns = []; //returns an array of ad campaigns that will fit in the podcast string, 
    var compatibleCampaignsExist = true; //booleans read more clearly than .length functions, even though this one took a couple of extra lines of code to generate
    console.log("Number of campaigns length..." + availableCampaigns.length);

    console.log("Audio string is: " + audioString);

    while(compatibleCampaignsExist){

        var compatibleCampaigns = getCompatibleCampaigns(audioString, availableCampaigns); //getting a list of compatible campaigns
        console.log("Compatible campaigns are... " + JSON.stringify(compatibleCampaigns));
        var campaign = getMostLucrativeCampaign(compatibleCampaigns); //filtering by most lucrative
        console.log("Most lucrative campaign is... " + JSON.stringify(campaign));
        audioString = replaceAudioStrings(audioString, campaign); // replacing ad slots with ads
        console.log("New audio string is... " + audioString);
        removeUsedCampaign(campaign, availableCampaigns); //splicing out bad index
        console.log("Available campaigns after stripping... " + JSON.stringify(campaign));
        compatibleCampaigns = getCompatibleCampaigns(audioString, availableCampaigns);
        if(compatibleCampaigns.length > 0){
            compatibleCampaignsExist = true;
        }else{
            compatibleCampaignsExist = false;
        }
        console.log("New list of compatible campaigns is... " + JSON.stringify(compatibleCampaigns));
    }
    
    var audioString = stripRemainingAdSlots(audioString);
    return audioString;
}

function getAvailableCampaigns(id, availableCampaigns){
    // strips out any campaigns that aren't part of the same ID group as podcast string
    var compatibleCampaigns = [];
    for(var campaign of availableCampaigns){
        var targets = campaign[0].targets;
        if(targets.indexOf(id) !== -1){
            compatibleCampaigns.push(campaign);
        }
    }

    return compatibleCampaigns;
}

function getCompatibleCampaigns(audioString, availableCampaigns){
    var compatibleCampaigns = []; //empty list of campaigns
    var stringData = getAdSlotsForString(audioString); //parsed string for comparison with each campaign
    //iterate over each item in list
    for(var campaign of availableCampaigns){
        var campaignData = getAdSlotsForCampaign(campaign);
        if(isValidOption(stringData, campaignData)){
            compatibleCampaigns.push(campaign);
        }
    }
    return compatibleCampaigns;
}

function getMostLucrativeCampaign(campaigns){
    /*
        It would probably be better to create as many valid audio strings as possible, point each of them, then return the most lucrative back to the user.
        That said, it'd add some complexity and blow through a lot of time. This method ensures that our starting point for audio creation is at least the most 
        lucrative standalone campaign targeted to each user. After that, we fill in remaining space with any other campaign that may fit the bill.
    */
    var bestCampaign = null;
    for(var campaign of campaigns){
        var analyzedCampaign = {
            combinedRevenue : 0,
            campaign : campaign
        };

        for(var ad of campaign){
            analyzedCampaign.combinedRevenue += ad.revenue;
        }
        if(bestCampaign === null || analyzedCampaign.revenue > bestCampaign.revenue){
            bestCampaign = analyzedCampaign;
        }
    }
    return bestCampaign.campaign;
}

function getAdSlotsForString(audioString){
    // extracts data from audio strings about remaining number of advertising slots
    var PRE = (audioString.match(/PRE/g) || []).length;
    var MID = (audioString.match(/MID/g) || []).length;
    var POST = (audioString.match(/POST/g) || []).length;
    // a little Regex help from Stack Overflow.
    return({
        PRE : PRE,
        MID : MID,
        POST : POST
    });
}

function getAdSlotsForCampaign(campaign){
    // quick utility method to extract data about each ad campaign

    var PRE = 0;
    var MID = 0;
    var POST = 0;

    for(var ad of campaign){
        if(ad.type === "PRE"){
            PRE++;
        }
        else if(ad.type === "MID"){
            MID++;
        }
        else{
            POST++;
        }
    }

    return({
        PRE : PRE,
        MID : MID,
        POST : POST
    });
}

function isValidOption(slotsInString, slotsInCampaign){ 
    // quick little utility function to gauge whether or not a campaign will "fit" in an audio string
    return(slotsInString.PRE >= slotsInCampaign.PRE && slotsInString.MID >= slotsInCampaign.MID && slotsInString.POST >= slotsInCampaign.POST)
}

function replaceAudioStrings(audioString, campaign){
    // replace audio string with valid adverts
    for(var ad of campaign){
        audioString = audioString.replace(ad.type, ad.audio);
    }

    return audioString;
}

function removeUsedCampaign(usedCampaign, availableCampaigns){
    // pretty self explanatory
    var indexToNuke = null;
    for(var i = 0; i < availableCampaigns.length; ++i){
        var tempCampaign = availableCampaigns[i];
        if(tempCampaign === usedCampaign){
            indexToNuke = i;
        }
    }

    availableCampaigns.splice(indexToNuke, 1);
}

function stripRemainingAdSlots(audioString){
    // for a seamless podcasting experience
    audioString = audioString.replace("[PRE]", "");
    audioString = audioString.replace("[MID]", "");
    audioString = audioString.replace("[POST]", "");
    return audioString;
}

generatePodcast(podcast1, campaignList);