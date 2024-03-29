using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class TaskLists : MonoBehaviour
{
    public GameObject[] ingressButtons;
    public GameObject[] egressButtons;
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

    private Dictionary<GameObject, float> originalIngressPositions = new Dictionary<GameObject, float>();
    private Dictionary<GameObject, float> originalEgressPositions = new Dictionary<GameObject, float>();
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
            originalIngressPositions[button] = button.transform.position.x;
        }
        foreach (GameObject button in egressButtons)
        {
            originalEgressPositions[button] = button.transform.position.x;
        }
    }

    void Update()
    {
        if (isIngress) && (isActive)
        {
            allIngressButtons.SetActive(true);
            allEgressButtons.SetActive(false);
        }
        else if (isIngress) && (isComplete)
        {
            allIngressButtons.SetActive(false);
            allEgressButtons.SetActive(false);
            allCompleteIngressButtons.SetActive(true);
        }
        else if (isEgress) && (isActive)
        {
            allIngressButtons.SetActive(false);
            allEgressButtons.SetActive(true);
        }
        else if (isEgress) && (isComplete)
        {
            allIngressButtons.SetActive(false);
            allEgressButtons.SetActive(false);
            allCompleteEgressButtons.SetActive(true);
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
        allCompleteIngressButtons.SetActive(false);
        allCompleteEgressButtons.SetActive(false);
        isActive = true;
        isComplete = false;
    }

    // Switch to complete state
    public void ToggleToComplete()
    {
        active.GetComponent<Image>().color = disabledColor;
        complete.GetComponent<Image>().color = enabledColor;
        allIngressButtons.SetActive(false);
        allEgressButtons.SetActive(false);
        isActive = false;
        isComplete = true;
    }

    public void ButtonIngressActive(GameObject button)
    {
        button.GetComponent<Button>().interactable = false;
        button.GetComponent<Image>().color = disabledColor;

        GameObject newButton = Instantiate(button, button.transform.position, button.transform.rotation);
        newButton.transform.SetParent(allCompleteIngressButtons.transform, false);

        newButton.transform.position = new Vector3(originalIngressPositions[button] + 390, button.transform.position.y, button.transform.position.z);
        newButton.GetComponent<Button>().interactable = true;
        newButton.GetComponent<Image>().color = enabledColor;
    }

    public void ButtonEgressActive(GameObject button)
    {
        button.GetComponent<Button>().interactable = false;
        button.GetComponent<Image>().color = disabledColor;

        GameObject newButton = Instantiate(button, button.transform.position, button.transform.rotation);
        newButton.transform.SetParent(allCompleteIngressButtons.transform, false);

        newButton.transform.position = new Vector3(originalEgressPositions[button] + 390, button.transform.position.y, button.transform.position.z);
        newButton.GetComponent<Button>().interactable = true;
        newButton.GetComponent<Image>().color = enabledColor;
    }

    public void ButtonComplete(GameObject button)
    {
        // Add some fixed value to the original position to move it right
        // button.transform.position = new Vector3(originalIngressPositions[button] + 390, button.transform.position.y, button.transform.position.z);
        // When the button is clicked, make it unclickable and change its color to disabled
    }
}