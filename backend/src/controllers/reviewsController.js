import Review from '../models/Reviews.js'
import Product from '../models/Products.js'
import User from '../models/User.js'

const reviewController = {}

reviewController.getReviews = async (req, res) => {
    const reviews = await Review.find().populate("usersId").populate("productId")
    res.json(reviews)
}

reviewController.postReview = async (req, res) => {
    const { usersId, productId, qualification, comments } = req.body
    const newReview = new Review({ usersId, productId, qualification, comments })
    await newReview.save()
    res.json({ message: "Review saved" })
}

reviewController.putReview = async (req, res) => {
    const { id } = req.params
    const { usersId, productId, qualification, comments } = req.body

    try {
        const updatedReview = await Review.findByIdAndUpdate(id, {
            usersId,
            productId,
            qualification,
            comments
        }, { new: true })

        if (!updatedReview) {
            return res.status(404).json({ message: "Review not found" })
        }

        res.json(updatedReview)
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error updating review", error: error.message })
    }
}

reviewController.deleteReview = async (req, res) => {
    const { id } = req.params

    try {   
        const deletedReview = await Review.findByIdAndDelete(id)

        if (!deletedReview) {
            return res.status(404).json({ message: "Review not found" })
        }

        res.json({ message: "Review deleted" + req.params.id })
    } catch (error) {
        console.error(error)
        res.status(500).json({ message: "Error deleting review" })
    }
}

export default reviewController
