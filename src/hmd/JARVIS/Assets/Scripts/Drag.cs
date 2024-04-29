using UnityEngine;
using UnityEngine.EventSystems;

public class Drag : MonoBehaviour, IPointerDownHandler, IDragHandler
{
    private Vector3 mOffset;

    public void OnDrag(PointerEventData eventData)
    {
        transform.position = eventData.pointerCurrentRaycast.worldPosition + mOffset;
    }

    public void OnPointerDown(PointerEventData eventData)
    {
        mOffset = gameObject.transform.position - eventData.pointerCurrentRaycast.worldPosition;
    }
}