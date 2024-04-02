using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class TaskLists : MonoBehaviour
{
    public GameObject[] ingressButtons;
    public GameObject[] egressButtons;
    public GameObject[] completeIngressButtons;
    public GameObject[] completeEgressButtons;

    public GameObject uiaButton;
    public GameObject active;
    public GameObject complete;
    public GameObject ingress;
    public GameObject egress;
    public GameObject allIngressButtons;
    public GameObject allEgressButtons;
    public GameObject allCompleteIngressButtons;
    public GameObject allCompleteEgressButtons;
    
    public Color enabledColor = Color.white;
    public Color disabledColor = Color.gray;

    private Dictionary<string, GameObject> activeIngressButtonDicts = new Dictionary<string, GameObject>();
    private Dictionary<string, GameObject> activeEgressButtonDicts = new Dictionary<string, GameObject>();
    private Dictionary<string, GameObject> completeIngressButtonDicts = new Dictionary<string, GameObject>();
    private Dictionary<string, GameObject> completeEgressButtonDicts = new Dictionary<string, GameObject>();

    private bool isUIA = false;
    private bool isIngress = false;
    private bool isEgress = false;
    private bool isActive = false;
    private bool isComplete = false;

    // Start is called before the first frame update
    void Start()
    {
        // Store the original x positions of the buttons and optionally set them to their start positions
        foreach (GameObject button in ingressButtons)
        {
            string buttonName = button.name;
            activeIngressButtonDicts[buttonName] = button;
        }
        foreach (GameObject button in egressButtons)
        {
            string buttonName = button.name;
            activeEgressButtonDicts[buttonName] = button;
        }
        foreach (GameObject button in completeIngressButtons)
        {
            string buttonName = button.name;
            button.GetComponent<Button>().interactable = true;
            button.GetComponent<Image>().color = enabledColor;
            button.SetActive(false);
            completeIngressButtonDicts[buttonName] = button;
        }
        foreach (GameObject button in completeEgressButtons)
        {
            string buttonName = button.name;
            button.GetComponent<Button>().interactable = true;
            button.GetComponent<Image>().color = enabledColor;
            button.SetActive(false);
            completeEgressButtonDicts[buttonName] = button;
        }
    }

    void Update()
    {
        if (isUIA)
        {
            if ((isIngress) && (isActive))
            {
                allIngressButtons.SetActive(true);
                allEgressButtons.SetActive(false);
                allCompleteIngressButtons.SetActive(false);
                allCompleteEgressButtons.SetActive(false);
            }
            else if ((isIngress) && (isComplete))
            {
                allIngressButtons.SetActive(false);
                allEgressButtons.SetActive(false);
                allCompleteIngressButtons.SetActive(true);
                allCompleteEgressButtons.SetActive(false);
            }
            else if ((isEgress) && (isActive))
            {
                allIngressButtons.SetActive(false);
                allEgressButtons.SetActive(true);
                allCompleteIngressButtons.SetActive(false);
                allCompleteEgressButtons.SetActive(false);
            }
            else if ((isEgress) && (isComplete))
            {
                allIngressButtons.SetActive(false);
                allEgressButtons.SetActive(false);
                allCompleteIngressButtons.SetActive(false);
                allCompleteEgressButtons.SetActive(true);
            }
        }
    }

    public void ToggleUIA()
    {
        active.SetActive(!active.activeSelf);
        complete.SetActive(!complete.activeSelf);
        ingress.SetActive(!ingress.activeSelf);
        egress.SetActive(!egress.activeSelf);

        if (isUIA)
        {
            allIngressButtons.SetActive(false);
            allEgressButtons.SetActive(false);
            allCompleteIngressButtons.SetActive(false);
            allCompleteEgressButtons.SetActive(false);
            isUIA = false;
        }
        else
        {
            ToggleToIngress();
            ToggleToActive();
            isUIA = true;
        }
    }

    // Switch to ingress state
    public void ToggleToIngress()
    {
        ingress.GetComponent<Image>().color = enabledColor;
        egress.GetComponent<Image>().color = disabledColor;
        isIngress = true;
        isEgress = false;
    }

    // Switch to egress state
    public void ToggleToEgress()
    {
        ingress.GetComponent<Image>().color = disabledColor;
        egress.GetComponent<Image>().color = enabledColor;
        isIngress = false;
        isEgress = true;
    }

    // Switch to active state
    public void ToggleToActive()
    {
        active.GetComponent<Image>().color = enabledColor;
        complete.GetComponent<Image>().color = disabledColor;
        isActive = true;
        isComplete = false;
    }

    // Switch to complete state
    public void ToggleToComplete()
    {
        active.GetComponent<Image>().color = disabledColor;
        complete.GetComponent<Image>().color = enabledColor;
        isActive = false;
        isComplete = true;
    }

    public void ButtonIngressActive(GameObject button)
    {
        button.GetComponent<Button>().interactable = false;
        button.GetComponent<Image>().color = disabledColor;

        string buttonName = button.name;
        string completeButtonName = buttonName + "Complete";
        GameObject newButton = completeIngressButtonDicts[completeButtonName];
        newButton.SetActive(true);
    }

    public void ButtonEgressActive(GameObject button)
    {
        button.GetComponent<Button>().interactable = false;
        button.GetComponent<Image>().color = disabledColor;

        string buttonName = button.name;
        string completeButtonName = buttonName + "Complete";
        GameObject newButton = completeEgressButtonDicts[completeButtonName];
        newButton.SetActive(true);
    }

    public void ButtonIngressComplete(GameObject button)
    {
        // Disable the button
        button.SetActive(false);

        // Enable the button in complete column
        string completeButtonName = button.name;
        string buttonName = completeButtonName.Replace("Complete", "");
        GameObject oldButton = activeIngressButtonDicts[buttonName];
        oldButton.GetComponent<Button>().interactable = true;
        oldButton.GetComponent<Image>().color = enabledColor;
    }

    public void ButtonEgressComplete(GameObject button)
    {
        // Disable the button
        button.SetActive(false);

        // Enable the button in complete column
        string completeButtonName = button.name;
        string buttonName = completeButtonName.Replace("Complete", "");
        GameObject oldButton = activeEgressButtonDicts[buttonName];
        oldButton.GetComponent<Button>().interactable = true;
        oldButton.GetComponent<Image>().color = enabledColor;
    }
}