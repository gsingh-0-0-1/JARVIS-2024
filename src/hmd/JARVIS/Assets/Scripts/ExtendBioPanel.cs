using System.Collections;
using System.Collections.Generic;
using UnityEngine;

public class ExtendBioPanel : MonoBehaviour
{
    public GameObject extension; 
    // Start is called before the first frame update
    public void OnExtendClick()
    {

        if (extension.activeSelf == true)
        {
            extension.SetActive(false);
        }
        else
        {
            extension.SetActive(true);
        }


    }
}
