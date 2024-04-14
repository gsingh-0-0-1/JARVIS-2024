using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using TMPro;
using UnityEngine.UI;

public class clearTaskList : MonoBehaviour
{

    public TMP_Text text;

    public void OnButtonClick() { 
        text.SetText("All tasks finished!");
        
    }
}
